import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Specialities
  const specialities = await Promise.all(
    [
      { name: 'Médecine générale', description: 'Médecin de famille, soins primaires' },
      { name: 'Cardiologie', description: 'Maladies du cœur et des vaisseaux' },
      { name: 'Dermatologie', description: 'Maladies de la peau' },
      { name: 'Pédiatrie', description: 'Médecine des enfants' },
      { name: 'Gynécologie', description: 'Santé féminine' },
      { name: 'Psychiatrie', description: 'Santé mentale' },
      { name: 'Ophtalmologie', description: 'Maladies des yeux' },
      { name: 'Orthopédie', description: 'Système musculo-squelettique' },
      { name: 'Neurologie', description: 'Système nerveux' },
      { name: 'Endocrinologie', description: 'Maladies hormonales et métaboliques' },
    ].map((s) => prisma.speciality.upsert({ where: { name: s.name }, update: {}, create: s })),
  );

  // Admin user
  const adminHash = await bcrypt.hash('Admin@1234', 12);
  await prisma.user.upsert({
    where: { email: 'admin@e-consult.ma' },
    update: {},
    create: {
      email: 'admin@e-consult.ma',
      passwordHash: adminHash,
      firstName: 'Super',
      lastName: 'Admin',
      role: 'ADMIN',
      isEmailVerified: true,
    },
  });

  // Demo doctor
  const doctorHash = await bcrypt.hash('Doctor@1234', 12);
  const doctorUser = await prisma.user.upsert({
    where: { email: 'dr.benali@e-consult.ma' },
    update: {},
    create: {
      email: 'dr.benali@e-consult.ma',
      passwordHash: doctorHash,
      firstName: 'Karim',
      lastName: 'Benali',
      phone: '+212612345678',
      role: 'DOCTOR',
      isEmailVerified: true,
    },
  });

  const medecinGenerale = specialities.find((s) => s.name === 'Médecine générale')!;

  await prisma.doctor.upsert({
    where: { userId: doctorUser.id },
    update: {},
    create: {
      userId: doctorUser.id,
      specialityId: medecinGenerale.id,
      licenseNumber: 'MED-MA-12345',
      bio: 'Médecin généraliste avec 10 ans d\'expérience. Spécialisé dans le suivi des maladies chroniques.',
      consultationFee: 200,
      isVerified: true,
      yearsOfExperience: 10,
      languages: ['FR', 'AR'],
      availabilities: {
        create: [
          { dayOfWeek: 1, startTime: '09:00', endTime: '17:00', slotMinutes: 30 },
          { dayOfWeek: 2, startTime: '09:00', endTime: '17:00', slotMinutes: 30 },
          { dayOfWeek: 3, startTime: '09:00', endTime: '12:00', slotMinutes: 30 },
          { dayOfWeek: 4, startTime: '09:00', endTime: '17:00', slotMinutes: 30 },
          { dayOfWeek: 5, startTime: '09:00', endTime: '15:00', slotMinutes: 30 },
        ],
      },
    },
  });

  // Demo patient
  const patientHash = await bcrypt.hash('Patient@1234', 12);
  const patientUser = await prisma.user.upsert({
    where: { email: 'patient@e-consult.ma' },
    update: {},
    create: {
      email: 'patient@e-consult.ma',
      passwordHash: patientHash,
      firstName: 'Fatima',
      lastName: 'Zahra',
      phone: '+212698765432',
      role: 'PATIENT',
      isEmailVerified: true,
    },
  });

  await prisma.patient.upsert({
    where: { userId: patientUser.id },
    update: {},
    create: {
      userId: patientUser.id,
      bloodType: 'O_POSITIVE',
      allergies: ['Pénicilline'],
      chronicConditions: ['Hypertension'],
    },
  });

  console.log('Seed completed!');
  console.log('Admin: admin@e-consult.ma / Admin@1234');
  console.log('Doctor: dr.benali@e-consult.ma / Doctor@1234');
  console.log('Patient: patient@e-consult.ma / Patient@1234');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
