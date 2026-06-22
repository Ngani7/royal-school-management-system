export type UserRole = "ADMIN" | "FINANCE" | "TEACHER" | "STUDENT" | "PARENT";

export interface User {
  id: string;
  username: string;
  role: UserRole;
  name: string;
  status: "ACTIVE" | "INACTIVE";
  token?: string;
}

// ==================== STAFF & PAYROLL ====================

export interface Staff {
  id: string;
  userId?: string;
  user?: User;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  employmentStatus: "ACTIVE" | "INACTIVE" | "RESIGNED";
  dateOfBirth?: string;
  idNumber?: string;
  bankAccount?: string;
  bankName?: string;
  dateJoined: string;
  department?: string; // HR, FINANCE, ADMIN, TEACHING, etc.
  position?: string;
  employmentRecords?: Employment[];
  payrolls?: Payroll[];
  payslips?: Payslip[];
  createdAt?: string;
  updatedAt?: string;
}

export interface SalaryScale {
  id: string;
  name: string; // "Head Teacher", "Senior Teacher", "Finance Officer"
  baseSalary: number;
  description?: string;
  createdAt?: string;
}

export interface Employment {
  id: string;
  staffId: string;
  staff?: Staff;
  salaryScaleId: string;
  salaryScale?: SalaryScale;
  effectiveDate: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD (if employment ended)
  status: "ACTIVE" | "SUSPENDED" | "ENDED";
  createdAt?: string;
  updatedAt?: string;
}

export interface DeductionType {
  id: string;
  name: string; // NAPSA, NHIMA, PAYE, etc.
  code: string;
  type: "FIXED" | "PERCENTAGE" | "CALCULATION";
  rate?: number; // For PERCENTAGE or FIXED type
  description?: string;
  payrollDeductions?: PayrollDeduction[];
  createdAt?: string;
}

export interface Payroll {
  id: string;
  staffId: string;
  staff?: Staff;
  paymentMonth: string; // YYYY-MM
  baseSalary: number;
  grossSalary: number; // baseSalary + bonuses/allowances
  totalDeductions: number;
  netSalary: number;
  status: "DRAFT" | "PROCESSED" | "PAID" | "CANCELLED";
  paymentDate?: string; // YYYY-MM-DD
  deductions?: PayrollDeduction[];
  payslips?: Payslip[];
  createdAt?: string;
  updatedAt?: string;
}

export interface PayrollDeduction {
  id: string;
  payrollId: string;
  payroll?: Payroll;
  deductionTypeId: string;
  deductionType?: DeductionType;
  amount: number;
  notes?: string;
  createdAt?: string;
}

export interface Payslip {
  id: string;
  payrollId: string;
  payroll?: Payroll;
  staffId: string;
  staff?: Staff;
  paymentMonth: string; // YYYY-MM
  baseSalary: number;
  grossSalary: number;
  totalDeductions: number;
  netSalary: number;
  generatedDate: string;
  paymentDate?: string; // YYYY-MM-DD
  createdAt?: string;
}

// ==================== ACADEMIC ====================

export interface AcademicTerm {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface Stream {
  id: string;
  name: string;
  classId: string;
  teacher?: string;
  _count?: {
    students: number;
  };
}

export interface Class {
  id: string;
  name: string;
  schoolLevel: "ECE" | "PRIMARY" | "SECONDARY";
  classTeacher?: string;
  capacity: number;
  academicYear: string;
  status: "ACTIVE" | "INACTIVE";
  streams: Stream[];
  _count?: {
    students: number;
  };
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  classSubjects?: ClassSubject[];
}

export interface ClassSubject {
  id: string;
  classId: string;
  streamId?: string;
  subjectId: string;
  class?: Class;
  subject?: Subject;
}

// ==================== TRANSPORT & LUNCH ====================

export interface TransportRoute {
  id: string;
  zoneName: string;
  monthlyFee: number;
  oneWayFee: number;
  details?: string;
  enrollments?: Array<{
    id: string;
    student: Student;
    type: "ROUND_TRIP" | "ONE_WAY";
  }>;
}

export interface LunchPlan {
  id: string;
  name: string;
  pricePerDay: number;
  details?: string;
  enrollments?: Array<{
    id: string;
    student: Student;
  }>;
}

// ==================== STUDENTS ====================

export interface Student {
  id: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  gender: "M" | "F";
  dateOfBirth: string;
  schoolLevel: "ECE" | "PRIMARY" | "SECONDARY";
  classId: string;
  class: Class;
  streamId?: string;
  stream?: Stream;
  academicYear: string;
  status: "ACTIVE" | "TRANSFERRED" | "GRADUATED" | "SUSPENDED";
  enrollmentDate: string;
  parentGuardianName: string;
  parentGuardianPhone: string;
  alternativeContact?: string;
  residentialAddress: string;

  // Extra relations loaded in detailed profile
  parents?: Array<{ parent: { firstName: string; lastName: string; phone: string; address?: string } }>;
  attendanceRecords?: AttendanceRecord[];
  results?: Result[];
  payments?: Payment[];
  transportEnrollment?: { route: TransportRoute; type: "ROUND_TRIP" | "ONE_WAY" };
  lunchEnrollment?: { lunchPlan: LunchPlan };
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  student: Student;
  status: "P" | "A" | "L" | "E"; // Present, Absent, Late, Excused
}

export interface Attendance {
  id: string;
  streamId: string;
  date: string;
  markedBy: string;
  records: AttendanceRecord[];
}

export interface Exam {
  id: string;
  name: string;
  type: "TEST" | "MIDTERM" | "FINAL";
  termId: string;
  classId: string;
  class: Class;
  subjectId: string;
  subject: Subject;
  date: string;
  results?: Result[];
}

export interface Result {
  id: string;
  examId: string;
  exam: Exam;
  studentId: string;
  student: Student;
  marks: number;
  grade: "A" | "B" | "C" | "D" | "F";
}

// ==================== FINANCE ====================

export interface FeeStructure {
  id: string;
  classId: string;
  class: Class;
  amount: number;
  description: string;
  termId: string;
}

export interface Payment {
  id: string;
  studentId: string;
  student: Student;
  amount: number;
  receiptNumber: string;
  date: string;
  paymentMethod: string;
  feesPaid: number;
  balance: number;
  academicTermId: string;
  academicTerm: AcademicTerm;
}

// ==================== COMMUNICATIONS ====================

export interface Announcement {
  id: string;
  title: string;
  content: string;
  targetRoles: string; // Serialized JSON array e.g. '["TEACHER","PARENT"]'
  createdBy: string;
  createdAt: string;
}
