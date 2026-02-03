import { Users, Calendar, Activity, LayoutList } from 'lucide-react';

export type ResourceKey = 'Patient' | 'Patient Appointment' | 'Healthcare Practitioner' | 'Practitioner Schedule';

export const RESOURCES = {
  Patient: {
    label: 'Patients',
    columns: ['patient_name', 'mobile', 'email'],
    fields: JSON.stringify(["name", "patient_name", "first_name", "last_name", "sex", "mobile", "email", "user_id", "age_html"]),
    filterableFields: ['sex', 'email'],
    updateFields: ['first_name', 'last_name', 'sex', 'mobile', 'email'],
    createFields: ['first_name', 'last_name', 'sex', 'mobile', 'email', 'user_id', 'age'],
    fieldMapping: { age: 'age_html' },
    icon: <Users className="h-5 w-5" />,
    color: "from-cyan-500 to-blue-500"
  },
  'Patient Appointment': {
    label: 'Appointments',
    fields: JSON.stringify(["name", "patient", "patient_name", "appointment_type", "appointment_date", "appointment_time", "status", "duration", "company", "department"]),
    columns: ['name', 'patient_name', 'appointment_date', 'appointment_time', 'status'],
    filterableFields: ['status', 'appointment_type', 'appointment_date'],
    createFields: ['company', 'appointment_date', 'appointment_type', 'patient', 'duration', 'appointment_time', 'notes'],
    requiredFields: ['company', 'appointment_date', 'appointment_type', 'patient', 'duration', 'appointment_time'],
    icon: <Calendar className="h-5 w-5" />,
    color: "from-purple-500 to-pink-500"
  },
  'Healthcare Practitioner': {
    label: 'Practitioners',
    fields: JSON.stringify(["first_name", "status", "mobile_phone", "name"]),
    columns: ['first_name', 'status', 'mobile_phone', 'name'],
    filterableFields: ['status'],
    icon: <Activity className="h-5 w-5" />,
    color: "from-emerald-500 to-teal-500"
  },
  'Practitioner Schedule': {
    label: 'Schedules',
    fields: JSON.stringify(["name", "docstatus", "schedule_name"]),
    columns: ['name', 'docstatus', 'schedule_name'],
    filterableFields: ['docstatus'],
    icon: <LayoutList className="h-5 w-5" />,
    color: "from-orange-500 to-amber-500"
  }
};

export const FIELD_TYPES: Record<string, { type: string; options?: string[]; placeholder?: string; default?: any }> = {
  sex: { type: 'select', options: ['Male', 'Female'] },
  email: { type: 'email', placeholder: 'email@example.com' },
  mobile: { type: 'tel', placeholder: '09XX XXX XXXX' },
  age: { type: 'number', placeholder: 'Age' },
  first_name: { type: 'text', placeholder: 'First Name' },
  last_name: { type: 'text', placeholder: 'Last Name' },
  status: { type: 'select', options: ['Active', 'Inactive', 'Disabled'] },
  docstatus: { type: 'select', options: ['0', '1', '2'] },
  appointment_date: { type: 'date' },
  appointment_time: { type: 'time' },
  company: { type: 'text', default: 'ebizolution' },
  duration: { type: 'number', default: '30' },
  notes: { type: 'textarea', placeholder: 'Notes...' },
};