export type BandKey = 'HIGH'|'EXCEEDS'|'MEETS'|'PARTIAL'|'NEEDS'
export type CapKey =
  | 'institutionalCommitment'
  | 'collaborationTeamwork'
  | 'professionalism'
  | 'clientService'
  | 'achievingResults'

export const BAND_POINTS_20: Record<BandKey, number> = {
  HIGH: 20,
  EXCEEDS: 16,
  MEETS: 12,
  PARTIAL: 8,
  NEEDS: 4,
}

export const BAND_LABEL: Record<BandKey, string> = {
  HIGH: 'Highly Exceeds',
  EXCEEDS: 'Exceeds',
  MEETS: 'Fully Meets',
  PARTIAL: 'Partially Meets',
  NEEDS: 'Needs Improvement',
}

export const CAP_LABEL: Record<CapKey, string> = {
  institutionalCommitment: 'Institutional Commitment',
  collaborationTeamwork: 'Collaboration and Teamwork',
  professionalism: 'Professionalism',
  clientService: 'Client Service',
  achievingResults: 'Achieving Results',
}

const PFX = {
  HIGH:  'Work characterized by a very high degree of professionalism (90%–100%):',
  EXCEEDS: 'Work characterized by a high degree of professionalism (80%–89%):',
  MEETS: 'Work characterized by a good degree of professionalism (60%–79%):',
  PARTIAL: 'Work characterized by an average degree of professionalism (50%–59%):',
  NEEDS: 'Work characterized by a degree of professionalism lower than 50%:',
} as const

export const CAP_EXPLANATIONS: Record<CapKey, Record<BandKey, string>> = {
  institutionalCommitment: {
    HIGH: [
      PFX.HIGH,
      '1) Observes University traditions, customs and values.',
      '2) Adheres to University regulations, rules and decisions.',
      '3) Effectively carries out mandated tasks.',
      '4) Adheres to time and meets deadlines in performing duties and mandated tasks.',
      '5) Consciously addresses problems and proposes suitable solutions.',
      '6) Constantly develops self by joining development programs (in-person or remote).',
    ].join('\n'),
    EXCEEDS: [
      PFX.EXCEEDS,
      '1) Observes University traditions, customs and values.',
      '2) Adheres to University regulations, rules and decisions.',
      '3) Effectively carries out mandated tasks.',
      '4) Adheres to time and meets deadlines in performing duties and mandated tasks.',
      '5) Consciously addresses problems and proposes suitable solutions.',
      '6) Constantly develops self by joining development programs (in-person or remote).',
    ].join('\n'),
    MEETS: [
      PFX.MEETS,
      '1) Observes University traditions, customs and values.',
      '2) Adheres to University regulations, rules and decisions.',
      '3) Effectively carries out mandated tasks.',
      '4) Adheres to time and meets deadlines in performing duties and mandated tasks.',
      '5) Consciously addresses problems and proposes suitable solutions.',
      '6) Constantly develops self by joining development programs (in-person or remote).',
    ].join('\n'),
    PARTIAL: [
      PFX.PARTIAL,
      '1) Observes University traditions, customs and values.',
      '2) Adheres to University regulations, rules and decisions.',
      '3) Effectively carries out mandated tasks.',
      '4) Adheres to time and meets deadlines in performing duties and mandated tasks.',
      '5) Consciously addresses problems and proposes suitable solutions.',
      '6) Constantly develops self by joining development programs (in-person or remote).',
    ].join('\n'),
    NEEDS: [
      PFX.NEEDS,
      '1) Observes University traditions, customs and values.',
      '2) Adheres to University regulations, rules and decisions.',
      '3) Effectively carries out mandated tasks.',
      '4) Adheres to time and meets deadlines in performing duties and mandated tasks.',
      '5) Consciously addresses problems and proposes suitable solutions.',
      '6) Constantly develops self by joining development programs (in-person or remote).',
    ].join('\n'),
  },

  collaborationTeamwork: {
    HIGH: [
      PFX.HIGH,
      '1) Collaborates with colleagues and is able to work within a team.',
      '2) Participates in conducting workshops and programs of teaching and academic performance development at the Unit for Teaching Excellence and Leadership.',
    ].join('\n'),
    EXCEEDS: [
      PFX.EXCEEDS,
      '1) Collaborates with colleagues and is able to work within a team.',
      '2) Participates in conducting workshops and programs of teaching and academic performance development at the Unit for Teaching Excellence and Leadership.',
    ].join('\n'),
    MEETS: [
      PFX.MEETS,
      '1) Collaborates with colleagues and is able to work within a team.',
      '2) Participates in conducting workshops and programs of teaching and academic performance development at the Unit for Teaching Excellence and Leadership.',
    ].join('\n'),
    PARTIAL: [
      PFX.PARTIAL,
      '1) Collaborates with colleagues and is able to work within a team.',
      '2) Participates in conducting workshops and programs of teaching and academic performance development at the Unit for Teaching Excellence and Leadership.',
    ].join('\n'),
    NEEDS: [
      PFX.NEEDS,
      '1) Collaborates with colleagues and is able to work within a team.',
      '2) Participates in conducting workshops and programs of teaching and academic performance development at the Unit for Teaching Excellence and Leadership.',
    ].join('\n'),
  },

  professionalism: {
    HIGH: [
      PFX.HIGH,
      '1) Sets comprehensive plans for teaching and evaluating academic courses.',
      '2) Committed to the implementation of the syllabus.',
      '3) Develops courses on a regular basis.',
      '4) Uses various assessment methods, and skillfully writes exams and other tools.',
      '5) Successfully completes HEA CPD fellowship (UK) via an accredited program at UoB Unit of Higher Education Excellence.',
    ].join('\n'),
    EXCEEDS: [
      PFX.EXCEEDS,
      '1) Sets comprehensive plans for teaching and evaluating academic courses.',
      '2) Committed to the implementation of the syllabus.',
      '3) Develops courses on a regular basis.',
      '4) Uses various assessment methods, and skillfully writes exams and other tools.',
      '5) Successfully completes HEA CPD fellowship (UK) via an accredited program at UoB Unit of Higher Education Excellence.',
    ].join('\n'),
    MEETS: [
      PFX.MEETS,
      '1) Sets comprehensive plans for teaching and evaluating academic courses.',
      '2) Committed to the implementation of the syllabus.',
      '3) Develops courses on a regular basis.',
      '4) Uses various assessment methods, and skillfully writes exams and other tools.',
      '5) Successfully completes HEA CPD fellowship (UK) via an accredited program at UoB Unit of Higher Education Excellence.',
    ].join('\n'),
    PARTIAL: [
      PFX.PARTIAL,
      '1) Sets comprehensive plans for teaching and evaluating academic courses.',
      '2) Committed to the implementation of the syllabus.',
      '3) Develops courses on a regular basis.',
      '4) Uses various assessment methods, and skillfully writes exams and other tools.',
      '5) Successfully completes HEA CPD fellowship (UK) via an accredited program at UoB Unit of Higher Education Excellence.',
    ].join('\n'),
    NEEDS: [
      PFX.NEEDS,
      '1) Sets comprehensive plans for teaching and evaluating academic courses.',
      '2) Committed to the implementation of the syllabus.',
      '3) Develops courses on a regular basis.',
      '4) Uses various assessment methods, and skillfully writes exams and other tools.',
      '5) Successfully completes HEA CPD fellowship (UK) via an accredited program at UoB Unit of Higher Education Excellence.',
    ].join('\n'),
  },

  clientService: {
    HIGH: [
      PFX.HIGH,
      '1) Employs different teaching methods.',
      '2) Well organized and clearly delivers ideas and thoughts.',
      '3) Uses modern technology in teaching.',
      '4) Utilizes e-learning means.',
      '5) Committed to academic advising.',
    ].join('\n'),
    EXCEEDS: [
      PFX.EXCEEDS,
      '1) Employs different teaching methods.',
      '2) Well organized and clearly delivers ideas and thoughts.',
      '3) Uses modern technology in teaching.',
      '4) Utilizes e-learning means.',
      '5) Committed to academic advising.',
    ].join('\n'),
    MEETS: [
      PFX.MEETS,
      '1) Employs different teaching methods.',
      '2) Well organized and clearly delivers ideas and thoughts.',
      '3) Uses modern technology in teaching.',
      '4) Utilizes e-learning means.',
      '5) Committed to academic advising.',
    ].join('\n'),
    PARTIAL: [
      PFX.PARTIAL,
      '1) Employs different teaching methods.',
      '2) Well organized and clearly delivers ideas and thoughts.',
      '3) Uses modern technology in teaching.',
      '4) Utilizes e-learning means.',
      '5) Committed to academic advising.',
    ].join('\n'),
    NEEDS: [
      PFX.NEEDS,
      '1) Employs different teaching methods.',
      '2) Well organized and clearly delivers ideas and thoughts.',
      '3) Uses modern technology in teaching.',
      '4) Utilizes e-learning means.',
      '5) Committed to academic advising.',
    ].join('\n'),
  },

  achievingResults: {
    HIGH: [
      PFX.HIGH,
      '1) Submits a comprehensive portfolio to the department on the courses taught.',
      '2) Gives feedback to students on test results and assignments.',
      '3) Participates in preparing accreditation requirements / institutional review (ETQA) at department/college/program level.',
      '4) Keeps contact with students after graduation and conveys development proposals to the department.',
      '5) Provides detailed reports on conference/symposium participation and how to utilize recommendations.',
    ].join('\n'),
    EXCEEDS: [
      PFX.EXCEEDS,
      '1) Submits a comprehensive portfolio to the department on the courses taught.',
      '2) Gives feedback to students on test results and assignments.',
      '3) Participates in preparing accreditation requirements / institutional review (ETQA) at department/college/program level.',
      '4) Keeps contact with students after graduation and conveys development proposals to the department.',
      '5) Provides detailed reports on conference/symposium participation and how to utilize recommendations.',
    ].join('\n'),
    MEETS: [
      PFX.MEETS,
      '1) Submits a comprehensive portfolio to the department on the courses taught.',
      '2) Gives feedback to students on test results and assignments.',
      '3) Participates in preparing accreditation requirements / institutional review (ETQA) at department/college/program level.',
      '4) Keeps contact with students after graduation and conveys development proposals to the department.',
      '5) Provides detailed reports on conference/symposium participation and how to utilize recommendations.',
    ].join('\n'),
    PARTIAL: [
      PFX.PARTIAL,
      '1) Submits a comprehensive portfolio to the department on the courses taught.',
      '2) Gives feedback to students on test results and assignments.',
      '3) Participates in preparing accreditation requirements / institutional review (ETQA) at department/college/program level.',
      '4) Keeps contact with students after graduation and conveys development proposals to the department.',
      '5) Provides detailed reports on conference/symposium participation and how to utilize recommendations.',
    ].join('\n'),
    NEEDS: [
      PFX.NEEDS,
      '1) Submits a comprehensive portfolio to the department on the courses taught.',
      '2) Gives feedback to students on test results and assignments.',
      '3) Participates in preparing accreditation requirements / institutional review (ETQA) at department/college/program level.',
      '4) Keeps contact with students after graduation and conveys development proposals to the department.',
      '5) Provides detailed reports on conference/symposium participation and how to utilize recommendations.',
    ].join('\n'),
  },
}

export function pointsForBand20(band: BandKey) {
  return BAND_POINTS_20[band]
}

export function overallBandFromAvg(avg20: number): BandKey {
  if (avg20 >= 18) return 'HIGH'
  if (avg20 >= 16) return 'EXCEEDS'
  if (avg20 >= 12) return 'MEETS'
  if (avg20 >= 8) return 'PARTIAL'
  return 'NEEDS'
}





















