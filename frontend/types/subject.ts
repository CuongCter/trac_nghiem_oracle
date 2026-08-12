export interface Subject {
  _id: string;
  name: string;
  code: string;
  description?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SubjectInput {
  name: string;
  code: string;
  description?: string;
}
