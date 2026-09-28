/**
 * Dev/staging seed data (engineering spec Section 10, Phase 2). NEVER run against production —
 * this writes questions directly with status: 'published', bypassing the author≠reviewer
 * publish rule (Section 5.6) that real content must go through. These are synthetic
 * textbook-level questions for exercising the practice loop, not reviewed course content — real
 * content comes through the Phase 5 bulk-upload path.
 *
 * Run with: pnpm seed
 *
 * Honors FIRESTORE_EMULATOR_HOST (set by `firebase emulators:exec` / `firebase emulators:start`)
 * to seed the local emulator without needing real service-account credentials. Otherwise falls
 * back to the same FIREBASE_PROJECT_ID/CLIENT_EMAIL/PRIVATE_KEY env vars as
 * src/lib/firebase/admin.ts (see .env.example / SETUP.md).
 */
import * as admin from 'firebase-admin';
import { DEFAULT_TENANT_ID } from '../src/types';

const SEED_AUTHOR_ID = 'seed-script';

interface QuestionSeed {
  subject: string;
  topic: string;
  stem: string;
  options: { id: 'A' | 'B' | 'C' | 'D'; text: string }[];
  correctOptionId: 'A' | 'B' | 'C' | 'D';
  correctExplanation: string;
  difficulty: 1 | 2 | 3;
}

const QUESTIONS: QuestionSeed[] = [
  // --- Internal Medicine / Cardiology ---
  {
    subject: 'Internal Medicine',
    topic: 'Cardiology',
    stem: 'A 55-year-old man presents with crushing central chest pain radiating to the left arm, with sweating and nausea. ECG shows ST-segment elevation in leads II, III, and aVF. Which coronary artery is most likely occluded?',
    options: [
      { id: 'A', text: 'Left anterior descending artery' },
      { id: 'B', text: 'Right coronary artery' },
      { id: 'C', text: 'Left circumflex artery' },
      { id: 'D', text: 'Left main coronary artery' },
    ],
    correctOptionId: 'B',
    correctExplanation:
      'ST elevation in the inferior leads (II, III, aVF) indicates an inferior wall MI, most commonly caused by occlusion of the right coronary artery.',
    difficulty: 2,
  },
  {
    subject: 'Internal Medicine',
    topic: 'Cardiology',
    stem: 'Which heart sound is best heard during rapid ventricular filling, and is a normal finding in children and pregnant women but often pathological (suggesting heart failure) in older adults?',
    options: [
      { id: 'A', text: 'S1' },
      { id: 'B', text: 'S2' },
      { id: 'C', text: 'S3' },
      { id: 'D', text: 'S4' },
    ],
    correctOptionId: 'C',
    correctExplanation:
      'S3 occurs during rapid ventricular filling; it is physiological in children and pregnancy but often pathological in older adults, signaling heart failure.',
    difficulty: 1,
  },
  {
    subject: 'Internal Medicine',
    topic: 'Cardiology',
    stem: 'A patient with atrial fibrillation has a CHA2DS2-VASc score of 3. What is the most appropriate next step to reduce stroke risk?',
    options: [
      { id: 'A', text: 'Aspirin alone' },
      { id: 'B', text: 'Oral anticoagulation' },
      { id: 'C', text: 'No treatment needed' },
      { id: 'D', text: 'Immediate electrical cardioversion' },
    ],
    correctOptionId: 'B',
    correctExplanation:
      'A CHA2DS2-VASc score of ≥2 in men (≥3 in women) indicates high enough stroke risk that oral anticoagulation is recommended.',
    difficulty: 2,
  },
  {
    subject: 'Internal Medicine',
    topic: 'Cardiology',
    stem: 'Which murmur is classically described as a harsh, crescendo-decrescendo systolic murmur best heard at the right upper sternal border, radiating to the carotids?',
    options: [
      { id: 'A', text: 'Mitral regurgitation' },
      { id: 'B', text: 'Aortic stenosis' },
      { id: 'C', text: 'Mitral stenosis' },
      { id: 'D', text: 'Aortic regurgitation' },
    ],
    correctOptionId: 'B',
    correctExplanation:
      'Aortic stenosis produces a crescendo-decrescendo systolic ejection murmur at the right upper sternal border, radiating to the carotids.',
    difficulty: 1,
  },

  // --- Internal Medicine / Endocrine ---
  {
    subject: 'Internal Medicine',
    topic: 'Endocrine',
    stem: 'A 30-year-old woman presents with weight loss, heat intolerance, palpitations, and a fine tremor. TSH is suppressed and free T4 is elevated. What is the most likely diagnosis?',
    options: [
      { id: 'A', text: "Hashimoto's thyroiditis" },
      { id: 'B', text: "Graves' disease" },
      { id: 'C', text: 'Subacute thyroiditis' },
      { id: 'D', text: 'Primary hypothyroidism' },
    ],
    correctOptionId: 'B',
    correctExplanation:
      "Suppressed TSH with elevated free T4 and hyperthyroid symptoms in a young woman is most consistent with Graves' disease, the most common cause of hyperthyroidism.",
    difficulty: 1,
  },
  {
    subject: 'Internal Medicine',
    topic: 'Endocrine',
    stem: 'Which is the first-line pharmacologic treatment for type 2 diabetes mellitus in most patients without contraindications?',
    options: [
      { id: 'A', text: 'Insulin' },
      { id: 'B', text: 'Sulfonylurea' },
      { id: 'C', text: 'Metformin' },
      { id: 'D', text: 'SGLT2 inhibitor' },
    ],
    correctOptionId: 'C',
    correctExplanation:
      'Metformin remains first-line therapy for type 2 diabetes due to its efficacy, safety profile, weight neutrality, and low cost.',
    difficulty: 1,
  },
  {
    subject: 'Internal Medicine',
    topic: 'Endocrine',
    stem: "A patient with Addison's disease is at greatest risk of which electrolyte abnormality?",
    options: [
      { id: 'A', text: 'Hyperkalemia and hyponatremia' },
      { id: 'B', text: 'Hypokalemia and hypernatremia' },
      { id: 'C', text: 'Hypercalcemia' },
      { id: 'D', text: 'Hypernatremia only' },
    ],
    correctOptionId: 'A',
    correctExplanation:
      'Primary adrenal insufficiency causes aldosterone deficiency, leading to sodium loss (hyponatremia) and potassium retention (hyperkalemia).',
    difficulty: 2,
  },
  {
    subject: 'Internal Medicine',
    topic: 'Endocrine',
    stem: 'Which test is most useful for assessing long-term (2-3 month) glycemic control in diabetic patients?',
    options: [
      { id: 'A', text: 'Fasting blood glucose' },
      { id: 'B', text: 'Random blood glucose' },
      { id: 'C', text: 'HbA1c' },
      { id: 'D', text: 'Oral glucose tolerance test' },
    ],
    correctOptionId: 'C',
    correctExplanation:
      'HbA1c reflects average blood glucose over the preceding 2-3 months, matching the lifespan of red blood cells.',
    difficulty: 1,
  },

  // --- Internal Medicine / Hepatology ---
  {
    subject: 'Internal Medicine',
    topic: 'Hepatology',
    stem: 'Which viral hepatitis is most commonly transmitted via the fecal-oral route and does not cause chronic infection?',
    options: [
      { id: 'A', text: 'Hepatitis B' },
      { id: 'B', text: 'Hepatitis C' },
      { id: 'C', text: 'Hepatitis A' },
      { id: 'D', text: 'Hepatitis D' },
    ],
    correctOptionId: 'C',
    correctExplanation:
      'Hepatitis A is transmitted fecal-orally and causes an acute, self-limited infection without progression to chronic hepatitis.',
    difficulty: 1,
  },
  {
    subject: 'Internal Medicine',
    topic: 'Hepatology',
    stem: 'A patient with cirrhosis develops confusion, asterixis, and fetor hepaticus. Elevated levels of which substance are most implicated in this presentation?',
    options: [
      { id: 'A', text: 'Ammonia' },
      { id: 'B', text: 'Bilirubin' },
      { id: 'C', text: 'Albumin' },
      { id: 'D', text: 'Creatinine' },
    ],
    correctOptionId: 'A',
    correctExplanation:
      'Hepatic encephalopathy is associated with elevated blood ammonia levels due to impaired hepatic clearance.',
    difficulty: 2,
  },
  {
    subject: 'Internal Medicine',
    topic: 'Hepatology',
    stem: 'Which is the most common cause of chronic liver disease worldwide?',
    options: [
      { id: 'A', text: 'Alcoholic liver disease' },
      { id: 'B', text: 'Autoimmune hepatitis' },
      { id: 'C', text: 'Chronic viral hepatitis (B and C)' },
      { id: 'D', text: "Wilson's disease" },
    ],
    correctOptionId: 'C',
    correctExplanation:
      'Chronic hepatitis B and C infections are, collectively, the leading cause of chronic liver disease and cirrhosis worldwide.',
    difficulty: 2,
  },
  {
    subject: 'Internal Medicine',
    topic: 'Hepatology',
    stem: 'Non-alcoholic fatty liver disease (NAFLD) is most strongly associated with which condition?',
    options: [
      { id: 'A', text: 'Metabolic syndrome / insulin resistance' },
      { id: 'B', text: 'Hepatitis A infection' },
      { id: 'C', text: 'Alpha-1 antitrypsin deficiency' },
      { id: 'D', text: 'Primary biliary cholangitis' },
    ],
    correctOptionId: 'A',
    correctExplanation:
      'NAFLD is closely linked to obesity, type 2 diabetes, and insulin resistance — the components of metabolic syndrome.',
    difficulty: 1,
  },

  // --- Internal Medicine / Chest ---
  {
    subject: 'Internal Medicine',
    topic: 'Chest',
    stem: 'A patient with COPD has chronic hypoxia. Which mechanism best explains the resulting secondary polycythemia?',
    options: [
      { id: 'A', text: 'Increased erythropoietin release due to chronic hypoxia' },
      { id: 'B', text: 'Decreased red cell destruction' },
      { id: 'C', text: 'Bone marrow fibrosis' },
      { id: 'D', text: 'Iron overload' },
    ],
    correctOptionId: 'A',
    correctExplanation:
      'Chronic hypoxia stimulates renal erythropoietin production, driving compensatory polycythemia.',
    difficulty: 2,
  },
  {
    subject: 'Internal Medicine',
    topic: 'Chest',
    stem: 'Which spirometry finding is characteristic of an obstructive lung disease such as asthma or COPD?',
    options: [
      { id: 'A', text: 'Reduced FEV1/FVC ratio' },
      { id: 'B', text: 'Increased FEV1/FVC ratio' },
      { id: 'C', text: 'Normal FEV1/FVC ratio with reduced FVC' },
      { id: 'D', text: 'Increased total lung capacity only, seen in restrictive disease' },
    ],
    correctOptionId: 'A',
    correctExplanation:
      'Obstructive diseases reduce airflow more than lung volume, lowering the FEV1/FVC ratio below the normal range (~0.7).',
    difficulty: 2,
  },
  {
    subject: 'Internal Medicine',
    topic: 'Chest',
    stem: 'A young patient presents with sudden-onset pleuritic chest pain and dyspnea. Chest X-ray shows a visible visceral pleural line with absent lung markings peripheral to it. What is the most likely diagnosis?',
    options: [
      { id: 'A', text: 'Pneumonia' },
      { id: 'B', text: 'Pneumothorax' },
      { id: 'C', text: 'Pulmonary embolism' },
      { id: 'D', text: 'Pleural effusion' },
    ],
    correctOptionId: 'B',
    correctExplanation:
      'A visible pleural line with absent peripheral lung markings on CXR is classic for pneumothorax.',
    difficulty: 1,
  },
  {
    subject: 'Internal Medicine',
    topic: 'Chest',
    stem: 'Which organism is the most common cause of community-acquired pneumonia?',
    options: [
      { id: 'A', text: 'Streptococcus pneumoniae' },
      { id: 'B', text: 'Pseudomonas aeruginosa' },
      { id: 'C', text: 'Klebsiella pneumoniae' },
      { id: 'D', text: 'Mycoplasma pneumoniae' },
    ],
    correctOptionId: 'A',
    correctExplanation:
      'Streptococcus pneumoniae remains the most common bacterial cause of community-acquired pneumonia.',
    difficulty: 1,
  },

  // --- Pharmacology / Autonomic Pharmacology ---
  {
    subject: 'Pharmacology',
    topic: 'Autonomic Pharmacology',
    stem: 'Atropine, a muscarinic receptor antagonist, would be expected to cause which combination of effects?',
    options: [
      { id: 'A', text: 'Bradycardia and miosis' },
      { id: 'B', text: 'Tachycardia and mydriasis' },
      { id: 'C', text: 'Bronchoconstriction' },
      { id: 'D', text: 'Increased salivation' },
    ],
    correctOptionId: 'B',
    correctExplanation:
      'Blocking muscarinic receptors removes parasympathetic tone, causing tachycardia, pupil dilation (mydriasis), and reduced secretions.',
    difficulty: 2,
  },
  {
    subject: 'Pharmacology',
    topic: 'Autonomic Pharmacology',
    stem: 'Which drug is first-line treatment for an acute anaphylactic reaction, acting via alpha-1 and beta-1/beta-2 adrenergic receptors?',
    options: [
      { id: 'A', text: 'A beta-blocker' },
      { id: 'B', text: 'Epinephrine (adrenaline)' },
      { id: 'C', text: 'An antihistamine' },
      { id: 'D', text: 'A corticosteroid' },
    ],
    correctOptionId: 'B',
    correctExplanation:
      'Epinephrine is first-line in anaphylaxis: alpha-1 agonism reverses vasodilation/hypotension, beta-1 increases cardiac output, and beta-2 causes bronchodilation.',
    difficulty: 1,
  },
  {
    subject: 'Pharmacology',
    topic: 'Autonomic Pharmacology',
    stem: 'Beta-2 adrenergic agonists such as salbutamol are used in asthma primarily because they cause which effect?',
    options: [
      { id: 'A', text: 'Bronchodilation' },
      { id: 'B', text: 'Bronchoconstriction' },
      { id: 'C', text: 'Increased mucus secretion' },
      { id: 'D', text: 'Vasoconstriction' },
    ],
    correctOptionId: 'A',
    correctExplanation: 'Beta-2 agonism relaxes bronchial smooth muscle, producing bronchodilation.',
    difficulty: 1,
  },
  {
    subject: 'Pharmacology',
    topic: 'Autonomic Pharmacology',
    stem: 'A patient taking a non-selective beta-blocker for hypertension also has asthma. Which adverse effect is of particular concern?',
    options: [
      { id: 'A', text: 'Bronchodilation' },
      { id: 'B', text: 'Bronchospasm' },
      { id: 'C', text: 'Improved airflow' },
      { id: 'D', text: 'No respiratory effect' },
    ],
    correctOptionId: 'B',
    correctExplanation:
      'Non-selective beta-blockers also block beta-2 receptors in the bronchi, which can precipitate bronchospasm in asthmatic patients.',
    difficulty: 2,
  },

  // --- Pharmacology / Antimicrobials ---
  {
    subject: 'Pharmacology',
    topic: 'Antimicrobials',
    stem: 'Penicillins exert their bactericidal effect primarily by inhibiting which bacterial structure?',
    options: [
      { id: 'A', text: 'Ribosomal protein synthesis' },
      { id: 'B', text: 'Cell wall synthesis' },
      { id: 'C', text: 'DNA gyrase' },
      { id: 'D', text: 'Folic acid synthesis' },
    ],
    correctOptionId: 'B',
    correctExplanation:
      'Beta-lactam antibiotics like penicillins inhibit peptidoglycan cross-linking in the bacterial cell wall, leading to cell lysis.',
    difficulty: 1,
  },
  {
    subject: 'Pharmacology',
    topic: 'Antimicrobials',
    stem: 'Which class of antibiotics is generally avoided in pregnancy and children due to effects on cartilage development?',
    options: [
      { id: 'A', text: 'Penicillins' },
      { id: 'B', text: 'Fluoroquinolones' },
      { id: 'C', text: 'Macrolides' },
      { id: 'D', text: 'Cephalosporins' },
    ],
    correctOptionId: 'B',
    correctExplanation:
      'Fluoroquinolones are generally avoided in pregnancy and children due to the risk of cartilage damage (arthropathy).',
    difficulty: 2,
  },
  {
    subject: 'Pharmacology',
    topic: 'Antimicrobials',
    stem: 'Aminoglycosides such as gentamicin are classically associated with which major adverse effects?',
    options: [
      { id: 'A', text: 'Hepatotoxicity and hair loss' },
      { id: 'B', text: 'Nephrotoxicity and ototoxicity' },
      { id: 'C', text: 'Cardiotoxicity only' },
      { id: 'D', text: 'Bone marrow suppression only' },
    ],
    correctOptionId: 'B',
    correctExplanation:
      'Aminoglycosides are classically associated with dose-dependent nephrotoxicity and ototoxicity.',
    difficulty: 1,
  },
  {
    subject: 'Pharmacology',
    topic: 'Antimicrobials',
    stem: 'Which mechanism best explains resistance to methicillin in MRSA (methicillin-resistant Staphylococcus aureus)?',
    options: [
      { id: 'A', text: 'Production of beta-lactamase only' },
      { id: 'B', text: 'Altered penicillin-binding protein (PBP2a) with reduced beta-lactam affinity' },
      { id: 'C', text: 'An efflux pump preventing drug entry' },
      { id: 'D', text: 'A ribosomal mutation' },
    ],
    correctOptionId: 'B',
    correctExplanation:
      'MRSA carries the mecA gene encoding PBP2a, an altered penicillin-binding protein with low affinity for beta-lactams, conferring resistance.',
    difficulty: 3,
  },

  // --- Pharmacology / Cardiovascular Pharmacology ---
  {
    subject: 'Pharmacology',
    topic: 'Cardiovascular Pharmacology',
    stem: 'ACE inhibitors lower blood pressure primarily by inhibiting the conversion of which substance?',
    options: [
      { id: 'A', text: 'Angiotensin I to angiotensin II' },
      { id: 'B', text: 'Angiotensinogen to angiotensin I' },
      { id: 'C', text: 'Renin release' },
      { id: 'D', text: 'Aldosterone to cortisol' },
    ],
    correctOptionId: 'A',
    correctExplanation:
      'ACE inhibitors block the enzyme that converts angiotensin I to the potent vasoconstrictor angiotensin II.',
    difficulty: 1,
  },
  {
    subject: 'Pharmacology',
    topic: 'Cardiovascular Pharmacology',
    stem: 'A common, characteristic side effect of ACE inhibitors, thought to be due to increased bradykinin levels, is which of the following?',
    options: [
      { id: 'A', text: 'Dry cough' },
      { id: 'B', text: 'Hyperkalemia only' },
      { id: 'C', text: 'Weight gain' },
      { id: 'D', text: 'Bradycardia' },
    ],
    correctOptionId: 'A',
    correctExplanation:
      'Reduced bradykinin breakdown by ACE inhibitors is thought to cause the characteristic dry, persistent cough.',
    difficulty: 2,
  },
  {
    subject: 'Pharmacology',
    topic: 'Cardiovascular Pharmacology',
    stem: 'Which class of antihypertensive drugs works by blocking L-type calcium channels in vascular smooth muscle and cardiac tissue?',
    options: [
      { id: 'A', text: 'Calcium channel blockers' },
      { id: 'B', text: 'Beta-blockers' },
      { id: 'C', text: 'Thiazide diuretics' },
      { id: 'D', text: 'ACE inhibitors' },
    ],
    correctOptionId: 'A',
    correctExplanation:
      'Calcium channel blockers such as amlodipine block L-type calcium channels, causing vasodilation and/or reduced cardiac contractility.',
    difficulty: 1,
  },
  {
    subject: 'Pharmacology',
    topic: 'Cardiovascular Pharmacology',
    stem: 'Digoxin toxicity is potentiated by which electrolyte abnormality?',
    options: [
      { id: 'A', text: 'Hyperkalemia' },
      { id: 'B', text: 'Hypokalemia' },
      { id: 'C', text: 'Hypernatremia' },
      { id: 'D', text: 'Hypercalcemia only' },
    ],
    correctOptionId: 'B',
    correctExplanation:
      'Hypokalemia increases digoxin binding to the Na+/K+-ATPase pump, increasing the risk of digoxin toxicity.',
    difficulty: 3,
  },

  // --- Anatomy / Upper Limb ---
  {
    subject: 'Anatomy',
    topic: 'Upper Limb',
    stem: 'Injury to the radial nerve at the mid-shaft of the humerus classically results in which clinical finding?',
    options: [
      { id: 'A', text: 'Wrist drop' },
      { id: 'B', text: 'Claw hand' },
      { id: 'C', text: 'Winged scapula' },
      { id: 'D', text: 'Foot drop' },
    ],
    correctOptionId: 'A',
    correctExplanation:
      'The radial nerve innervates the extensor muscles of the forearm; injury at the humeral shaft causes wrist drop.',
    difficulty: 1,
  },
  {
    subject: 'Anatomy',
    topic: 'Upper Limb',
    stem: "Injury to which nerve produces a 'claw hand' deformity due to loss of most intrinsic hand muscles?",
    options: [
      { id: 'A', text: 'Median nerve' },
      { id: 'B', text: 'Ulnar nerve' },
      { id: 'C', text: 'Radial nerve' },
      { id: 'D', text: 'Musculocutaneous nerve' },
    ],
    correctOptionId: 'B',
    correctExplanation:
      'The ulnar nerve innervates most intrinsic hand muscles; its injury classically produces a claw hand deformity.',
    difficulty: 2,
  },
  {
    subject: 'Anatomy',
    topic: 'Upper Limb',
    stem: 'The axillary nerve is most commonly injured in which of the following?',
    options: [
      { id: 'A', text: 'Surgical neck fracture of the humerus' },
      { id: 'B', text: 'Mid-shaft humeral fracture' },
      { id: 'C', text: 'Supracondylar fracture' },
      { id: 'D', text: "Colles' fracture" },
    ],
    correctOptionId: 'A',
    correctExplanation:
      'The axillary nerve wraps around the surgical neck of the humerus and is at risk with fractures there or anterior shoulder dislocation.',
    difficulty: 2,
  },
  {
    subject: 'Anatomy',
    topic: 'Upper Limb',
    stem: 'Which muscle is the primary abductor of the shoulder from roughly 15-90 degrees, innervated by the axillary nerve?',
    options: [
      { id: 'A', text: 'Supraspinatus' },
      { id: 'B', text: 'Deltoid' },
      { id: 'C', text: 'Infraspinatus' },
      { id: 'D', text: 'Teres minor' },
    ],
    correctOptionId: 'B',
    correctExplanation:
      'The deltoid, innervated by the axillary nerve, is the main abductor of the arm from about 15-90 degrees.',
    difficulty: 1,
  },

  // --- Anatomy / Thorax ---
  {
    subject: 'Anatomy',
    topic: 'Thorax',
    stem: 'The phrenic nerve, which innervates the diaphragm, arises from which spinal nerve roots?',
    options: [
      { id: 'A', text: 'C1-C2' },
      { id: 'B', text: 'C3-C5' },
      { id: 'C', text: 'T1-T4' },
      { id: 'D', text: 'L1-L2' },
    ],
    correctOptionId: 'B',
    correctExplanation: "The phrenic nerve arises mainly from C3, C4, and C5 ('C3, 4, 5 keep the diaphragm alive').",
    difficulty: 1,
  },
  {
    subject: 'Anatomy',
    topic: 'Thorax',
    stem: 'The apex of the heart is typically located in which intercostal space, at the midclavicular line?',
    options: [
      { id: 'A', text: '3rd intercostal space' },
      { id: 'B', text: '5th intercostal space' },
      { id: 'C', text: '7th intercostal space' },
      { id: 'D', text: '2nd intercostal space' },
    ],
    correctOptionId: 'B',
    correctExplanation:
      'The cardiac apex is classically located in the 5th left intercostal space at the midclavicular line.',
    difficulty: 1,
  },
  {
    subject: 'Anatomy',
    topic: 'Thorax',
    stem: 'Which structure passes through the diaphragm at the level of T8?',
    options: [
      { id: 'A', text: 'Aorta' },
      { id: 'B', text: 'Esophagus' },
      { id: 'C', text: 'Inferior vena cava' },
      { id: 'D', text: 'Thoracic duct' },
    ],
    correctOptionId: 'C',
    correctExplanation: 'The IVC passes through the diaphragm at T8; the esophagus at T10; the aorta at T12.',
    difficulty: 2,
  },
  {
    subject: 'Anatomy',
    topic: 'Thorax',
    stem: 'The right lung differs from the left lung in that it has how many lobes?',
    options: [
      { id: 'A', text: 'Two' },
      { id: 'B', text: 'Three' },
      { id: 'C', text: 'Four' },
      { id: 'D', text: 'One' },
    ],
    correctOptionId: 'B',
    correctExplanation:
      'The right lung has three lobes (upper, middle, lower); the left lung has two (upper, lower) to accommodate the heart.',
    difficulty: 1,
  },

  // --- Anatomy / Abdomen ---
  {
    subject: 'Anatomy',
    topic: 'Abdomen',
    stem: "McBurney's point, used to localize appendicitis pain, lies at which landmark?",
    options: [
      {
        id: 'A',
        text: 'The junction of the medial and lateral two-thirds of a line from the umbilicus to the right anterior superior iliac spine',
      },
      { id: 'B', text: 'The midpoint between the xiphoid process and umbilicus' },
      { id: 'C', text: 'The junction of the costal margin and midclavicular line' },
      { id: 'D', text: 'The midpoint of the inguinal ligament' },
    ],
    correctOptionId: 'A',
    correctExplanation:
      "McBurney's point lies at the junction of the lateral and medial two-thirds of the line from the umbilicus to the right ASIS.",
    difficulty: 2,
  },
  {
    subject: 'Anatomy',
    topic: 'Abdomen',
    stem: 'The portal vein is formed by the union of which two veins?',
    options: [
      { id: 'A', text: 'Splenic vein and superior mesenteric vein' },
      { id: 'B', text: 'Renal vein and splenic vein' },
      { id: 'C', text: 'Inferior mesenteric vein and renal vein' },
      { id: 'D', text: 'Hepatic vein and splenic vein' },
    ],
    correctOptionId: 'A',
    correctExplanation:
      'The portal vein is formed behind the neck of the pancreas by the union of the splenic vein and superior mesenteric vein.',
    difficulty: 2,
  },
  {
    subject: 'Anatomy',
    topic: 'Abdomen',
    stem: 'Which organ lies in the retroperitoneal space, making it relatively protected from direct blunt abdominal trauma compared to intraperitoneal organs?',
    options: [
      { id: 'A', text: 'Spleen' },
      { id: 'B', text: 'Kidney' },
      { id: 'C', text: 'Stomach' },
      { id: 'D', text: 'Small intestine' },
    ],
    correctOptionId: 'B',
    correctExplanation: 'The kidneys are retroperitoneal structures, situated behind the peritoneal cavity.',
    difficulty: 1,
  },
  {
    subject: 'Anatomy',
    topic: 'Abdomen',
    stem: 'Gallbladder pain classically refers to which site, relevant to referred pain patterns?',
    options: [
      { id: 'A', text: 'The right shoulder, via the phrenic nerve' },
      { id: 'B', text: 'The left shoulder, via the vagus nerve' },
      { id: 'C', text: 'The lower back, via the sciatic nerve' },
      { id: 'D', text: 'The right hip, via the femoral nerve' },
    ],
    correctOptionId: 'A',
    correctExplanation:
      'Gallbladder pain can refer to the right shoulder/scapula because the diaphragm shares the phrenic nerve (C3-C5) dermatome with the shoulder.',
    difficulty: 3,
  },

  // --- Pathology / Inflammation & Repair ---
  {
    subject: 'Pathology',
    topic: 'Inflammation & Repair',
    stem: 'Which cell type is the hallmark of acute inflammation, typically arriving first at the site of injury?',
    options: [
      { id: 'A', text: 'Lymphocytes' },
      { id: 'B', text: 'Neutrophils' },
      { id: 'C', text: 'Macrophages' },
      { id: 'D', text: 'Plasma cells' },
    ],
    correctOptionId: 'B',
    correctExplanation: 'Neutrophils are the first responders in acute inflammation, typically arriving within hours.',
    difficulty: 1,
  },
  {
    subject: 'Pathology',
    topic: 'Inflammation & Repair',
    stem: 'Granulation tissue, formed during wound healing, is characterized by which combination of components?',
    options: [
      { id: 'A', text: 'New capillaries and fibroblasts' },
      { id: 'B', text: 'Dense collagen only' },
      { id: 'C', text: 'Necrotic debris only' },
      { id: 'D', text: 'Calcified tissue' },
    ],
    correctOptionId: 'A',
    correctExplanation:
      'Granulation tissue consists of proliferating fibroblasts and new capillary growth (angiogenesis), giving it a granular, pink appearance.',
    difficulty: 2,
  },
  {
    subject: 'Pathology',
    topic: 'Inflammation & Repair',
    stem: 'Which cardinal sign of inflammation is caused primarily by vasodilation and increased blood flow?',
    options: [
      { id: 'A', text: 'Rubor (redness)' },
      { id: 'B', text: 'Dolor (pain)' },
      { id: 'C', text: 'Tumor (swelling)' },
      { id: 'D', text: 'Functio laesa (loss of function)' },
    ],
    correctOptionId: 'A',
    correctExplanation: 'Redness (rubor) results from local vasodilation increasing blood flow to the inflamed area.',
    difficulty: 1,
  },
  {
    subject: 'Pathology',
    topic: 'Inflammation & Repair',
    stem: 'Healing by primary intention, as in a clean surgical incision, differs from healing by secondary intention mainly in which way?',
    options: [
      { id: 'A', text: 'Primary intention involves minimal tissue loss and closely apposed wound edges' },
      { id: 'B', text: 'Primary intention always requires a skin graft' },
      { id: 'C', text: 'Secondary intention heals faster' },
      { id: 'D', text: 'Secondary intention does not involve granulation tissue' },
    ],
    correctOptionId: 'A',
    correctExplanation:
      'Primary intention healing occurs when wound edges are close together with minimal tissue loss, leading to a smaller scar and faster healing than secondary intention.',
    difficulty: 2,
  },

  // --- Pathology / Neoplasia ---
  {
    subject: 'Pathology',
    topic: 'Neoplasia',
    stem: 'Which term describes the spread of cancer cells to a distant site via the bloodstream or lymphatics, forming a secondary tumor?',
    options: [
      { id: 'A', text: 'Metaplasia' },
      { id: 'B', text: 'Dysplasia' },
      { id: 'C', text: 'Metastasis' },
      { id: 'D', text: 'Hyperplasia' },
    ],
    correctOptionId: 'C',
    correctExplanation:
      'Metastasis is the spread of malignant cells from the primary tumor to distant sites, forming secondary growths.',
    difficulty: 1,
  },
  {
    subject: 'Pathology',
    topic: 'Neoplasia',
    stem: 'A tumor marker commonly elevated in hepatocellular carcinoma is which of the following?',
    options: [
      { id: 'A', text: 'CA-125' },
      { id: 'B', text: 'Alpha-fetoprotein (AFP)' },
      { id: 'C', text: 'PSA' },
      { id: 'D', text: 'CEA' },
    ],
    correctOptionId: 'B',
    correctExplanation: 'Alpha-fetoprotein (AFP) is classically elevated in hepatocellular carcinoma.',
    difficulty: 2,
  },
  {
    subject: 'Pathology',
    topic: 'Neoplasia',
    stem: 'Which feature characteristically distinguishes malignant from benign tumors on histology?',
    options: [
      { id: 'A', text: 'Well-circumscribed borders' },
      { id: 'B', text: 'Slow growth rate' },
      { id: 'C', text: 'Invasion of surrounding tissue' },
      { id: 'D', text: 'Presence of a capsule' },
    ],
    correctOptionId: 'C',
    correctExplanation:
      'Invasion into surrounding tissue (and potential for metastasis) is a defining feature of malignancy, unlike benign tumors which remain localized/encapsulated.',
    difficulty: 1,
  },
  {
    subject: 'Pathology',
    topic: 'Neoplasia',
    stem: "Which gene is the most commonly mutated across human cancers, earning it the nickname 'guardian of the genome'?",
    options: [
      { id: 'A', text: 'RB1' },
      { id: 'B', text: 'p53 (TP53)' },
      { id: 'C', text: 'BRCA1' },
      { id: 'D', text: 'RAS' },
    ],
    correctOptionId: 'B',
    correctExplanation:
      "TP53 (p53) is the most commonly mutated gene across human cancers and is called the 'guardian of the genome' for its role in the DNA damage response and apoptosis.",
    difficulty: 3,
  },

  // --- Pathology / Hemodynamics ---
  {
    subject: 'Pathology',
    topic: 'Hemodynamics',
    stem: 'A thrombus that breaks off and travels through the venous system to lodge in the pulmonary arteries causes which condition?',
    options: [
      { id: 'A', text: 'Deep vein thrombosis' },
      { id: 'B', text: 'Pulmonary embolism' },
      { id: 'C', text: 'Myocardial infarction' },
      { id: 'D', text: 'Cerebral infarction' },
    ],
    correctOptionId: 'B',
    correctExplanation:
      'An embolus originating from a venous thrombus (commonly the deep leg veins) that lodges in the pulmonary arterial circulation causes a pulmonary embolism.',
    difficulty: 1,
  },
  {
    subject: 'Pathology',
    topic: 'Hemodynamics',
    stem: "Which component of Virchow's triad refers to abnormalities such as atherosclerosis or vasculitis that predispose to thrombosis?",
    options: [
      { id: 'A', text: 'Stasis of blood flow' },
      { id: 'B', text: 'Endothelial injury' },
      { id: 'C', text: 'Hypercoagulability' },
      { id: 'D', text: 'Hypocoagulability' },
    ],
    correctOptionId: 'B',
    correctExplanation:
      "Endothelial injury (e.g. from atherosclerosis) is one of the three components of Virchow's triad, alongside stasis and hypercoagulability.",
    difficulty: 2,
  },
  {
    subject: 'Pathology',
    topic: 'Hemodynamics',
    stem: 'Localized swelling due to increased fluid in the interstitial tissue space is termed which of the following?',
    options: [
      { id: 'A', text: 'Edema' },
      { id: 'B', text: 'Effusion' },
      { id: 'C', text: 'Congestion' },
      { id: 'D', text: 'Infarction' },
    ],
    correctOptionId: 'A',
    correctExplanation: 'Edema refers to excess fluid accumulation in the interstitial tissue spaces.',
    difficulty: 1,
  },
  {
    subject: 'Pathology',
    topic: 'Hemodynamics',
    stem: 'A reduction in blood supply to a tissue, if severe or prolonged enough, results in tissue death termed which of the following?',
    options: [
      { id: 'A', text: 'Infarction' },
      { id: 'B', text: 'Hyperemia' },
      { id: 'C', text: 'Edema' },
      { id: 'D', text: 'Thrombosis' },
    ],
    correctOptionId: 'A',
    correctExplanation:
      'Infarction is tissue necrosis resulting from an inadequate blood supply (ischemia) severe or prolonged enough to cause cell death.',
    difficulty: 2,
  },
];

async function main() {
  const usingEmulator = Boolean(process.env.FIRESTORE_EMULATOR_HOST);

  if (usingEmulator) {
    admin.initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID ?? 'demo-pulseq' });
    console.log(`Seeding via Firestore emulator at ${process.env.FIRESTORE_EMULATOR_HOST}`);
  } else {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    if (!projectId || !clientEmail || !privateKey) {
      throw new Error(
        'Missing Firebase admin credentials, and FIRESTORE_EMULATOR_HOST is not set. Set ' +
          'FIREBASE_PROJECT_ID/FIREBASE_CLIENT_EMAIL/FIREBASE_PRIVATE_KEY to seed a real project, ' +
          'or run against the emulator (see SETUP.md).',
      );
    }
    admin.initializeApp({ credential: admin.credential.cert({ projectId, clientEmail, privateKey }) });
    console.log(`Seeding project ${projectId} — this should be a dev/staging project, never production.`);
  }

  const db = admin.firestore();
  const questionsRef = db.collection('questions');

  // Re-runnable: clear out any previous seed-script output before writing fresh docs.
  const existing = await questionsRef.where('authorId', '==', SEED_AUTHOR_ID).get();
  if (!existing.empty) {
    const deleteBatch = db.batch();
    existing.docs.forEach((doc) => deleteBatch.delete(doc.ref));
    await deleteBatch.commit();
    console.log(`Deleted ${existing.size} previously-seeded question(s).`);
  }

  const writeBatch = db.batch();
  const now = admin.firestore.FieldValue.serverTimestamp();

  for (const q of QUESTIONS) {
    const ref = questionsRef.doc();
    writeBatch.set(ref, {
      tenantId: DEFAULT_TENANT_ID,
      stem: q.stem,
      options: q.options,
      correctOptionId: q.correctOptionId,
      correctExplanation: q.correctExplanation,
      subject: q.subject,
      topic: q.topic,
      tagsRaw: `${q.subject}, ${q.topic}`,
      difficulty: q.difficulty,
      status: 'published',
      sourceReviewed: false,
      authorId: SEED_AUTHOR_ID,
      createdAt: now,
      updatedAt: now,
    });
  }

  await writeBatch.commit();
  console.log(`Seeded ${QUESTIONS.length} published questions across ${new Set(QUESTIONS.map((q) => q.subject)).size} subjects.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
