export interface WorkExperience {
  id: string;
  jobTitle: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  responsibilities: string[];
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  dateObtained: string;
  expirationDate: string;
}

export interface ResumeData {
  personalInfo: {
    fullName: string;
    jobTitle: string;
    email: string;
    phone: string;
    location: string;
    website: string;
    linkedin: string;
  };
  workExperience: WorkExperience[];
  education: Education[];
  skills: string[];
  certifications: Certification[];
}

export const EMPTY_RESUME: ResumeData = {
  personalInfo: {
    fullName: '',
    jobTitle: '',
    email: '',
    phone: '',
    location: '',
    website: '',
    linkedin: '',
  },
  workExperience: [],
  education: [],
  skills: [],
  certifications: [],
};

let idCounter = 0;
export function generateId(): string {
  return `${Date.now()}-${++idCounter}`;
}
