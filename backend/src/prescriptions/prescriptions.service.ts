import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { UserRole } from '@prisma/client';
import PDFDocument from 'pdfkit';

export interface MedicationDto {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

export interface CreatePrescriptionDto {
  appointmentId: string;
  medications: MedicationDto[];
  instructions?: string;
  validityDays?: number;
}

@Injectable()
export class PrescriptionsService {
  constructor(private prisma: PrismaService) {}

  async create(doctorUserId: string, dto: CreatePrescriptionDto) {
    const doctor = await this.prisma.doctor.findUnique({ where: { userId: doctorUserId } });
    if (!doctor) throw new ForbiddenException('Only doctors can create prescriptions');

    const appointment = await this.prisma.appointment.findUnique({
      where: { id: dto.appointmentId },
      include: { patient: { include: { user: true } }, doctor: { include: { user: true } } },
    });

    if (!appointment) throw new NotFoundException('Appointment not found');
    if (appointment.doctorId !== doctor.id) throw new ForbiddenException();

    const existing = await this.prisma.prescription.findUnique({
      where: { appointmentId: dto.appointmentId },
    });
    if (existing) throw new BadRequestException('Prescription already exists for this appointment');

    const validityDays = dto.validityDays ?? 90;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + validityDays);

    const prescription = await this.prisma.prescription.create({
      data: {
        appointmentId: dto.appointmentId,
        patientId: appointment.patientId,
        doctorId: doctor.id,
        medications: dto.medications as any,
        instructions: dto.instructions,
        validityDays,
        expiresAt,
        isSigned: true,
      },
    });

    return prescription;
  }

  async findAll(userId: string, role: UserRole) {
    if (role === UserRole.PATIENT) {
      const patient = await this.prisma.patient.findUnique({ where: { userId } });
      if (!patient) return [];
      return this.prisma.prescription.findMany({
        where: { patientId: patient.id },
        include: { doctor: { include: { user: true } } },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (role === UserRole.DOCTOR) {
      const doctor = await this.prisma.doctor.findUnique({ where: { userId } });
      if (!doctor) return [];
      return this.prisma.prescription.findMany({
        where: { doctorId: doctor.id },
        include: { patient: { include: { user: true } } },
        orderBy: { createdAt: 'desc' },
      });
    }

    return [];
  }

  async findOne(id: string, userId: string, role: UserRole) {
    const prescription = await this.prisma.prescription.findUnique({
      where: { id },
      include: {
        patient: { include: { user: true } },
        doctor: { include: { user: true, speciality: true } },
        appointment: true,
      },
    });

    if (!prescription) throw new NotFoundException('Prescription not found');

    if (role === UserRole.PATIENT) {
      const patient = await this.prisma.patient.findUnique({ where: { userId } });
      if (prescription.patientId !== patient?.id) throw new ForbiddenException();
    } else if (role === UserRole.DOCTOR) {
      const doctor = await this.prisma.doctor.findUnique({ where: { userId } });
      if (prescription.doctorId !== doctor?.id) throw new ForbiddenException();
    }

    return prescription;
  }

  async generatePdf(id: string, userId: string, role: UserRole): Promise<Buffer> {
    const prescription = await this.findOne(id, userId, role);
    const medications = prescription.medications as MedicationDto[];

    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      const doc = new PDFDocument({ size: 'A4', margin: 50 });

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc
        .fontSize(20)
        .font('Helvetica-Bold')
        .text('ORDONNANCE MÉDICALE', { align: 'center' });
      doc.moveDown(0.5);

      doc
        .fontSize(12)
        .font('Helvetica')
        .text('E-Consult — Plateforme de Téléconsultation', { align: 'center' });

      doc.moveTo(50, doc.y + 10).lineTo(545, doc.y + 10).stroke();
      doc.moveDown();

      // Doctor info
      const doctor = prescription.doctor;
      doc
        .fontSize(11)
        .font('Helvetica-Bold')
        .text('Médecin prescripteur :');
      doc
        .font('Helvetica')
        .text(`Dr. ${doctor.user.firstName} ${doctor.user.lastName}`)
        .text(`Spécialité : ${doctor.speciality.name}`)
        .text(`N° de licence : ${doctor.licenseNumber}`);

      doc.moveDown();

      // Patient info
      const patient = prescription.patient;
      doc.font('Helvetica-Bold').text('Patient :');
      doc
        .font('Helvetica')
        .text(`${patient.user.firstName} ${patient.user.lastName}`)
        .text(`Date de naissance : ${patient.user.dateOfBirth?.toLocaleDateString('fr-FR') ?? 'N/A'}`)
        .text(`Téléphone : ${patient.user.phone ?? 'N/A'}`);

      doc.moveDown();

      // Date
      doc
        .font('Helvetica-Bold')
        .text(`Date : ${new Date(prescription.createdAt).toLocaleDateString('fr-FR')}`);
      doc.moveDown();

      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown();

      // Medications
      doc.font('Helvetica-Bold').fontSize(13).text('MÉDICAMENTS PRESCRITS');
      doc.moveDown(0.5);

      medications.forEach((med, index) => {
        doc
          .font('Helvetica-Bold')
          .fontSize(11)
          .text(`${index + 1}. ${med.name} — ${med.dosage}`);
        doc
          .font('Helvetica')
          .fontSize(10)
          .text(`   Posologie : ${med.frequency}`)
          .text(`   Durée : ${med.duration}`);
        if (med.instructions) {
          doc.text(`   Instructions : ${med.instructions}`);
        }
        doc.moveDown(0.3);
      });

      if (prescription.instructions) {
        doc.moveDown();
        doc.font('Helvetica-Bold').fontSize(11).text('Instructions générales :');
        doc.font('Helvetica').text(prescription.instructions);
      }

      // Footer
      doc.moveDown(2);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown(0.5);
      doc
        .font('Helvetica')
        .fontSize(9)
        .fillColor('#666666')
        .text(
          `Ordonnance valable jusqu'au ${prescription.expiresAt.toLocaleDateString('fr-FR')} — ${prescription.isSigned ? 'Signée électroniquement' : 'Non signée'}`,
          { align: 'center' },
        );

      doc.end();
    });
  }
}
