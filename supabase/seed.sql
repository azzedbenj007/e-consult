-- =====================================================================
-- L'Agora — données de démonstration (facultatif)
-- À exécuter après schema.sql. Les publications sans auteur apparaissent
-- comme « Communication interne ».
-- =====================================================================

insert into public.posts (author_id, kind, category, title, body, pinned) values
 (null,'news','equipement','Un nouvel IRM 3 Tesla arrive au pôle imagerie',
  'Installation prévue la semaine prochaine. Les équipes de manipulateurs seront formées par le constructeur. Merci aux services techniques et biomédical pour la préparation de la salle !', true),
 (null,'news','qvt','Semaine de la QVT : programme complet',
  'Ateliers sophrologie, massages assis, stand nutrition au self et tournoi de pétanque inter-services. Inscriptions ouvertes dans l''onglet Bien-être.', false),
 (null,'news','sante','Campagne de vaccination antigrippale du personnel',
  'Le service de santé au travail tient une permanence sans rendez-vous du lundi au jeudi, 11h-14h, bâtiment B, rez-de-chaussée.', false),
 (null,'portrait','vis-ma-vie','Vis ma vie : une journée en stérilisation centrale',
  'Chaque jour, l''équipe de stérilisation traite plus de 2 000 dispositifs. Rencontre avec ces professionnels de l''ombre sans qui aucun bloc ne pourrait tourner.', false);

insert into public.posts (author_id, kind, category, title, body, event_date, location) values
 (null,'event','sport','Tournoi de foot inter-services','Équipes de 7, mixtes bienvenues. Inscription auprès de l''Amicale.', now() + interval '9 days', 'Stade municipal'),
 (null,'event','depart','Pot de départ en retraite de Martine (lingerie)','35 ans de maison ! Venez nombreux la remercier.', now() + interval '3 days', 'Salle du personnel, bât. A'),
 (null,'event','qvt','Atelier sophrologie (30 min)','Places limitées à 12 personnes, tenue libre.', now() + interval '5 days', 'Salle Zen, 2e étage');

insert into public.posts (author_id, kind, category, title, body) values
 (null,'annonce','covoiturage','Covoiturage Villeneuve → Hôpital, poste 7h-19h','Je fais le trajet en 12h jour, du lundi au jeudi. 2 places dispo, participation aux frais.'),
 (null,'annonce','troc','Donne poussette + siège auto','En très bon état, à récupérer sur le parking P2.'),
 (null,'annonce','logement','Interne cherche studio pour le semestre de mai','Proche hôpital ou ligne de tram, budget 550 € CC.');

insert into public.posts (author_id, kind, title, body, to_team) values
 (null,'kudos','Merci la logistique !','Un immense merci à l''équipe logistique pour le réassort express pendant le pic de vendredi soir. Les urgences.', 'Logistique'),
 (null,'kudos','Bravo au brancardage','Toujours le sourire, même à 3h du matin. Merci ! — L''équipe de nuit de cardiologie', 'Brancardage');

insert into public.resources (section, category, title, body, url, phone, tags) values
 ('procedure','RH','Poser un congé','Connectez-vous au logiciel de gestion des temps, rubrique « Mes absences ». Délai de prévenance : 15 jours.', null, null, '{conge,rh,absence}'),
 ('procedure','RH','Déclarer un accident de trajet','Prévenez votre cadre sous 24h, puis remplissez le formulaire AT/MP auprès de la DRH.', null, null, '{accident,trajet,rh}'),
 ('procedure','Formation','Demander une formation','Formulaire à remplir avec votre cadre lors de l''entretien annuel ou en cours d''année.', null, null, '{formation,dpc}'),
 ('procedure','Sécurité','Protocole incendie : les 4 réflexes','Donner l''alerte (poste 18), évacuer horizontalement, fermer les portes, ne pas utiliser les ascenseurs.', null, '18', '{incendie,securite}'),
 ('procedure','Hygiène','Tri des déchets (DASRI / DAOM)','Sac jaune : DASRI. Sac noir : ordures ménagères. Carton : collecteur dédié.', null, null, '{dechets,hygiene,tri}'),
 ('annuaire','Urgences techniques','Astreinte technique (fuite, panne électrique)', null, null, '4444', '{technique,panne}'),
 ('annuaire','Services','Standard', null, null, '9', '{standard}'),
 ('annuaire','Services','Service informatique (hotline)', null, null, '5000', '{informatique,hotline}'),
 ('annuaire','Services','Santé au travail', null, null, '3210', '{sante,travail}'),
 ('accueil','Plan','Vestiaires du personnel','Bâtiment A, sous-sol -1. Badge requis.', null, null, '{vestiaire,plan}'),
 ('accueil','Plan','Self du personnel','Bâtiment C, rez-de-chaussée. Ouvert 11h15-14h30 et 18h30-20h.', null, null, '{self,repas}'),
 ('accueil','Plan','Parkings personnel','P2 et P4 réservés au personnel (badge). Navette toutes les 15 min depuis P4.', null, null, '{parking,navette}'),
 ('accueil','Intégration','Checklist nouvel arrivant','Badge, tenues, accès informatique, visite du service, formation incendie.', null, null, '{accueil,integration}'),
 ('avantage','Loisirs','Cinéma Le Rex : -30 %','Sur présentation du badge professionnel.', null, null, '{cinema,loisirs}'),
 ('avantage','Sport','Salle de sport FitClub : 19 €/mois','Sans engagement, accès 24h/24, idéal en horaires décalés.', null, null, '{sport}'),
 ('avantage','Vacances','Chèques vacances Amicale','Dossier à déposer avant le 31 mars.', null, null, '{vacances}'),
 ('pratique','Crèche','Crèche du personnel','Ouverte 6h15 - 21h30, 7j/7. Inscriptions auprès de la DRH.', null, '2100', '{creche,enfants}'),
 ('pratique','Navettes','Navette P4 ↔ Hall principal','Toutes les 15 min de 6h à 22h.', null, null, '{navette,transport}'),
 ('pratique','Permanences','Permanence mutuelle','Le 1er mardi du mois, 12h-14h, salle B12.', null, null, '{mutuelle}'),
 ('bienetre','Sport','Yoga du midi','Mardi et jeudi 12h30-13h15, salle Zen.', null, null, '{yoga,sport}'),
 ('bienetre','Ergonomie','5 étirements pour le dos en fin de poste','Fiche illustrée du service de santé au travail.', null, null, '{dos,ergonomie}');

insert into public.menus (day, starter, main, veggie, dessert, theme)
select (date_trunc('week', now())::date + d),
       (array['Carottes râpées','Velouté potiron','Taboulé','Salade grecque','Œuf mimosa'])[d+1],
       (array['Poulet basquaise','Lasagnes','Poisson pané, riz','Couscous','Bœuf bourguignon'])[d+1],
       (array['Curry de légumes','Lasagnes végé','Falafels','Couscous légumes','Gratin dauphinois'])[d+1],
       (array['Yaourt','Tarte aux pommes','Fruit de saison','Mousse chocolat','Crème brûlée'])[d+1],
       case when d = 3 then 'Saveurs d''Orient' end
from generate_series(0,4) d
on conflict (day) do nothing;

insert into public.clubs (name, emoji, description) values
 ('Running','🏃','Sorties du dimanche matin et préparation du semi-marathon.'),
 ('Club lecture','📚','Un livre par mois, échange autour d''un café.'),
 ('Jardinage','🌱','Potager partagé derrière le bâtiment D.'),
 ('Cuisine','🍳','Recettes rapides compatibles horaires décalés.')
on conflict (name) do nothing;

insert into public.polls (question, options, closes_at) values
 ('Quel menu thématique souhaitez-vous au self pour la fin du mois ?',
  array['Cuisine italienne','Street food','Antillais','Brunch'], now() + interval '14 days');
