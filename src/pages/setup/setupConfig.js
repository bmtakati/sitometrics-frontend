// Configuration data for all setup pages

export const setupConfig = {
  'absenteeism-type': {
    title: 'Absenteeism Types',
    description: 'Manage different types of absenteeism',
    icon: '📝',
    fields: [
      { name: 'name', label: 'Type Name', required: true, unique: true, placeholder: 'Enter type name' },
      { name: 'category', label: 'Category', required: true, type: 'select', options: ['Full Day', 'Half Day', 'Partial', 'Other'] },
      { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Enter description' }
    ],
    sampleData: Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      name: ['Sick Leave', 'Personal Day', 'Bereavement', 'Jury Duty', 'Military Leave', 'Maternity Leave', 'Paternity Leave', 'Study Leave'][i % 8],
      category: ['Full Day', 'Half Day', 'Partial', 'Other'][i % 4],
      description: `Absenteeism type description ${i + 1}`,
      status: i % 6 === 0 ? 'Inactive' : 'Active'
    }))
  },
  'book-type': {
    title: 'Book Types',
    description: 'Manage library book categories',
    icon: '📚',
    fields: [
      { name: 'name', label: 'Book Type', required: true, placeholder: 'Enter book type' },
      { name: 'code', label: 'Code', required: true, placeholder: 'Enter code' },
      { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Enter description' }
    ],
    sampleData: Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      name: ['Textbook', 'Reference', 'Fiction', 'Non-Fiction', 'Biography', 'Science', 'History', 'Mathematics', 'Literature', 'Arts'][i % 10],
      code: `BT${String(i + 1).padStart(3, '0')}`,
      description: `Description for book type ${i + 1}`,
      status: i % 8 === 0 ? 'Inactive' : 'Active'
    }))
  },
  'class': {
    title: 'Classes',
    description: 'Manage school classes and grades',
    icon: '🎓',
    fields: [
      { name: 'name', label: 'Class Name', required: true, unique: true, placeholder: 'Enter class name' },
      { name: 'code', label: 'Class Code', required: true, placeholder: 'Enter class code' },
      { name: 'capacity', label: 'Capacity', type: 'number', placeholder: 'Enter capacity' }
    ],
    sampleData: Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      name: `Class ${i + 1}`,
      code: `CLS${String(i + 1).padStart(3, '0')}`,
      capacity: 30 + (i % 10) * 5,
      status: i % 7 === 0 ? 'Inactive' : 'Active'
    }))
  },
  'combination': {
    title: 'Combinations',
    description: 'Manage subject combinations',
    icon: '🔗',
    fields: [
      { name: 'name', label: 'Combination Name', required: true, placeholder: 'Enter combination name' },
      { name: 'code', label: 'Code', required: true, placeholder: 'Enter code' },
      { name: 'subjects', label: 'Subject Count', type: 'number', placeholder: 'Number of subjects' }
    ],
    sampleData: Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      name: ['PCM', 'PCB', 'Arts', 'Commerce', 'Science', 'Humanities', 'Technical', 'Vocational'][i % 8],
      code: `CMB${String(i + 1).padStart(3, '0')}`,
      subjects: 3 + (i % 5),
      status: i % 6 === 0 ? 'Inactive' : 'Active'
    }))
  },
  'document-type': {
    title: 'Document Types',
    description: 'Manage document categories',
    icon: '📄',
    fields: [
      { name: 'name', label: 'Document Type', required: true, unique: true, placeholder: 'Enter document type' },
      { name: 'code', label: 'Code', required: true, placeholder: 'Enter code' },
      { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Enter description' }
    ],
    sampleData: Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      name: ['Birth Certificate', 'ID Card', 'Passport', 'Transcript', 'Certificate', 'Letter', 'Report', 'Invoice'][i % 8],
      code: `DOC${String(i + 1).padStart(3, '0')}`,
      description: `Document type description ${i + 1}`,
      status: i % 7 === 0 ? 'Inactive' : 'Active'
    }))
  },
  'guide-type': {
    title: 'Guide Types',
    description: 'Manage user guide types',
    icon: '📘',
    fields: [
      { name: 'name', label: 'Guide Type', required: true, placeholder: 'Enter guide type' },
      { name: 'code', label: 'Code', required: true, placeholder: 'Enter code' },
      { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Enter description' }
    ],
    sampleData: Array.from({ length: 8 }, (_, i) => ({
      id: i + 1,
      name: ['Getting Started', 'User Manual', 'Reference', 'Troubleshooting', 'Best Practices', 'How-to', 'Video Guide', 'Policy Guide'][i % 8],
      code: `GDT${String(i + 1).padStart(3, '0')}`,
      description: `Guide type description ${i + 1}`,
      status: i % 6 === 0 ? 'Inactive' : 'Active'
    }))
  },
  'question-category': {
    title: 'Question Categories',
    description: 'Manage categories used for FAQ question registration',
    icon: '❓',
    fields: [
      { name: 'name', label: 'Category Name', required: true, placeholder: 'Enter category name' },
      { name: 'code', label: 'Code', required: true, placeholder: 'Enter code' },
      { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Enter description' }
    ],
    sampleData: Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      name: ['Getting Started', 'Account Management & Login', 'Access & Roles', 'Data Management', 'Reporting & Exports', 'School Management', 'Compatibility', 'Security & Privacy', 'Training & Support', 'General'][i % 10],
      code: `QCT${String(i + 1).padStart(3, '0')}`,
      description: `Question category description ${i + 1}`,
      status: i % 7 === 0 ? 'Inactive' : 'Active'
    }))
  },
  'dropout-reason': {
    title: 'Dropout Reasons',
    description: 'Manage student dropout reasons',
    icon: '📉',
    fields: [
      { name: 'name', label: 'Reason', required: true, unique: true, placeholder: 'Enter dropout reason' },
      { name: 'category', label: 'Category', type: 'select', options: ['Financial', 'Academic', 'Personal', 'Health', 'Other'] },
      { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Enter description' }
    ],
    sampleData: Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      name: ['Financial Issues', 'Poor Performance', 'Health Problems', 'Family Reasons', 'Migration', 'Marriage', 'Employment', 'Lack of Interest'][i % 8],
      category: ['Financial', 'Academic', 'Personal', 'Health', 'Other'][i % 5],
      description: `Dropout reason description ${i + 1}`,
      status: i % 6 === 0 ? 'Inactive' : 'Active'
    }))
  },
  'education-level': {
    title: 'Education Levels',
    description: 'Manage education levels and qualifications',
    icon: '🎯',
    fields: [
      { name: 'name', label: 'Level Name', required: true, unique: true, placeholder: 'Enter education level' },
      { name: 'code', label: 'Code', required: true, placeholder: 'Enter code' },
      { name: 'order', label: 'Order', type: 'number', placeholder: 'Display order' }
    ],
    sampleData: Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      name: ['Pre-Primary', 'Primary', 'Secondary', 'High School', 'Diploma', 'Bachelor', 'Master', 'PhD'][i % 8],
      code: `EDL${String(i + 1).padStart(3, '0')}`,
      order: i + 1,
      status: i % 9 === 0 ? 'Inactive' : 'Active'
    }))
  },
  'facility-type': {
    title: 'Facility Types',
    description: 'Manage school facility types',
    icon: '🏫',
    fields: [
      { name: 'name', label: 'Facility Type', required: true, unique: true, placeholder: 'Enter facility type' },
      { name: 'code', label: 'Code', required: true, placeholder: 'Enter code' },
      { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Enter description' }
    ],
    sampleData: Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      name: ['Classroom', 'Laboratory', 'Library', 'Sports Field', 'Cafeteria', 'Auditorium', 'Computer Lab', 'Art Room'][i % 8],
      code: `FAC${String(i + 1).padStart(3, '0')}`,
      description: `Facility type description ${i + 1}`,
      status: i % 7 === 0 ? 'Inactive' : 'Active'
    }))
  },
  'funding-source': {
    title: 'Funding Sources',
    description: 'Manage funding sources',
    icon: '💰',
    fields: [
      { name: 'name', label: 'Source Name', required: true, unique: true, placeholder: 'Enter funding source' },
      { name: 'code', label: 'Code', required: true, placeholder: 'Enter code' },
      { name: 'type', label: 'Type', type: 'select', options: ['Government', 'Private', 'NGO', 'International', 'Other'] }
    ],
    sampleData: Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      name: ['Government Grant', 'Private Donation', 'NGO Funding', 'International Aid', 'Corporate CSR', 'Alumni Fund', 'Tuition Fees', 'Bank Loan'][i % 8],
      code: `FND${String(i + 1).padStart(3, '0')}`,
      type: ['Government', 'Private', 'NGO', 'International', 'Other'][i % 5],
      status: i % 6 === 0 ? 'Inactive' : 'Active'
    }))
  },
  'gender': {
    title: 'Genders',
    description: 'Manage gender types',
    icon: '👥',
    fields: [
      { name: 'name', label: 'Gender', required: true, unique: true, placeholder: 'Enter gender' },
      { name: 'code', label: 'Code', required: true, placeholder: 'Enter code' }
    ],
    sampleData: [
      { id: 1, name: 'Male', code: 'M', status: 'Active' },
      { id: 2, name: 'Female', code: 'F', status: 'Active' },
      { id: 3, name: 'Other', code: 'O', status: 'Active' },
      { id: 4, name: 'Prefer not to say', code: 'N', status: 'Active' }
    ]
  },
  'level': {
    title: 'Levels',
    description: 'Manage academic levels',
    icon: '📊',
    fields: [
      { name: 'name', label: 'Level Name', required: true, unique: true, placeholder: 'Enter level name' },
      { name: 'code', label: 'Code', required: true, placeholder: 'Enter code' },
      { name: 'order', label: 'Order', type: 'number', placeholder: 'Display order' }
    ],
    sampleData: Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      name: `Level ${i + 1}`,
      code: `LVL${String(i + 1).padStart(3, '0')}`,
      order: i + 1,
      status: i % 8 === 0 ? 'Inactive' : 'Active'
    }))
  },
  'level-category': {
    title: 'Level Categories',
    description: 'Manage level categories',
    icon: '📂',
    fields: [
      { name: 'name', label: 'Category Name', required: true, unique: true, placeholder: 'Enter category name' },
      { name: 'code', label: 'Code', required: true, placeholder: 'Enter code' },
      { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Enter description' }
    ],
    sampleData: Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      name: ['Beginner', 'Intermediate', 'Advanced', 'Expert', 'Foundation', 'Core', 'Elective', 'Optional'][i % 8],
      code: `LVC${String(i + 1).padStart(3, '0')}`,
      description: `Level category description ${i + 1}`,
      status: i % 7 === 0 ? 'Inactive' : 'Active'
    }))
  },
  'occupation-type': {
    title: 'Occupation Types',
    description: 'Manage occupation categories',
    icon: '💼',
    fields: [
      { name: 'name', label: 'Occupation', required: true, unique: true, placeholder: 'Enter occupation type' },
      { name: 'code', label: 'Code', required: true, placeholder: 'Enter code' },
      { name: 'category', label: 'Category', type: 'select', options: ['Professional', 'Technical', 'Administrative', 'Manual', 'Other'] }
    ],
    sampleData: Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      name: ['Doctor', 'Engineer', 'Teacher', 'Lawyer', 'Accountant', 'Farmer', 'Businessman', 'Government Employee'][i % 8],
      code: `OCC${String(i + 1).padStart(3, '0')}`,
      category: ['Professional', 'Technical', 'Administrative', 'Manual', 'Other'][i % 5],
      status: i % 6 === 0 ? 'Inactive' : 'Active'
    }))
  },
  'ownership-type': {
    title: 'Ownership Types',
    description: 'Manage ownership types',
    icon: '🏢',
    fields: [
      { name: 'name', label: 'Ownership Type', required: true, unique: true, placeholder: 'Enter ownership type' },
      { name: 'code', label: 'Code', required: true, placeholder: 'Enter code' }
    ],
    sampleData: Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      name: ['Government', 'Private', 'Public-Private Partnership', 'NGO', 'Trust', 'Society'][i % 6],
      code: `OWN${String(i + 1).padStart(3, '0')}`,
      status: i % 7 === 0 ? 'Inactive' : 'Active'
    }))
  },
  'name-prefix': {
    title: 'Name Prefixes',
    description: 'Manage name prefixes and titles',
    icon: '👤',
    fields: [
      { name: 'name', label: 'Prefix', required: true, unique: true, placeholder: 'Enter name prefix' },
      { name: 'code', label: 'Code', required: true, placeholder: 'Enter code' }
    ],
    sampleData: [
      { id: 1, name: 'Mr.', code: 'MR', status: 'Active' },
      { id: 2, name: 'Mrs.', code: 'MRS', status: 'Active' },
      { id: 3, name: 'Ms.', code: 'MS', status: 'Active' },
      { id: 4, name: 'Dr.', code: 'DR', status: 'Active' },
      { id: 5, name: 'Prof.', code: 'PROF', status: 'Active' },
      { id: 6, name: 'Rev.', code: 'REV', status: 'Active' },
      { id: 7, name: 'Hon.', code: 'HON', status: 'Active' },
      { id: 8, name: 'Sir', code: 'SIR', status: 'Active' },
      { id: 9, name: 'Madam', code: 'MAD', status: 'Active' },
      { id: 10, name: 'Master', code: 'MAST', status: 'Active' }
    ]
  },
  'profession': {
    title: 'Professions',
    description: 'Manage professional categories',
    icon: '👔',
    fields: [
      { name: 'name', label: 'Profession Name', required: true, unique: true, placeholder: 'Enter profession' },
      { name: 'code', label: 'Code', required: true, placeholder: 'Enter code' },
      { name: 'category', label: 'Category', type: 'select', options: ['Teaching', 'Administrative', 'Support', 'Technical', 'Other'] }
    ],
    sampleData: Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      name: ['Teacher', 'Principal', 'Administrator', 'Counselor', 'Librarian', 'IT Specialist', 'Accountant', 'Security', 'Janitor', 'Driver'][i % 10],
      code: `PRF${String(i + 1).padStart(3, '0')}`,
      category: ['Teaching', 'Administrative', 'Support', 'Technical', 'Other'][i % 5],
      status: i % 6 === 0 ? 'Inactive' : 'Active'
    }))
  },
  'responsibility': {
    title: 'Responsibilities',
    description: 'Manage staff responsibilities',
    icon: '📋',
    fields: [
      { name: 'name', label: 'Responsibility', required: true, unique: true, placeholder: 'Enter responsibility' },
      { name: 'code', label: 'Code', required: true, placeholder: 'Enter code' },
      { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Enter description' }
    ],
    sampleData: Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      name: ['Class Teacher', 'Subject Coordinator', 'Exam Invigilator', 'Sports Coach', 'Club Advisor', 'Head of Department', 'Mentor', 'Lab Supervisor'][i % 8],
      code: `RSP${String(i + 1).padStart(3, '0')}`,
      description: `Responsibility description ${i + 1}`,
      status: i % 7 === 0 ? 'Inactive' : 'Active'
    }))
  },
  'resource-type': {
    title: 'Resource Types',
    description: 'Manage learning resource types',
    icon: '📦',
    fields: [
      { name: 'name', label: 'Resource Type', required: true, unique: true, placeholder: 'Enter resource type' },
      { name: 'code', label: 'Code', required: true, placeholder: 'Enter code' },
      { name: 'category', label: 'Category', type: 'select', options: ['Physical', 'Digital', 'Human', 'Financial', 'Other'] }
    ],
    sampleData: Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      name: ['Books', 'Computers', 'Lab Equipment', 'Sports Equipment', 'Furniture', 'Software', 'Digital Content', 'Teaching Aids'][i % 8],
      code: `RSC${String(i + 1).padStart(3, '0')}`,
      category: ['Physical', 'Digital', 'Human', 'Financial', 'Other'][i % 5],
      status: i % 6 === 0 ? 'Inactive' : 'Active'
    }))
  },
  'review-score': {
    title: 'Review Scores',
    description: 'Manage review scoring system',
    icon: '⭐',
    fields: [
      { name: 'name', label: 'Score Name', required: true, unique: true, placeholder: 'Enter score name' },
      { name: 'value', label: 'Score Value', type: 'number', required: true, placeholder: 'Enter score value' },
      { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Enter description' }
    ],
    sampleData: Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      name: ['Excellent', 'Very Good', 'Good', 'Satisfactory', 'Needs Improvement', 'Unsatisfactory'][i % 6],
      value: 5 - (i % 6),
      description: `Score description ${i + 1}`,
      status: i % 8 === 0 ? 'Inactive' : 'Active'
    }))
  },
  'salary-scale': {
    title: 'Salary Scales',
    description: 'Manage salary scale ranges',
    icon: '💵',
    fields: [
      { name: 'name', label: 'Scale Name', required: true, unique: true, placeholder: 'Enter scale name' },
      { name: 'code', label: 'Code', required: true, placeholder: 'Enter code' },
      { name: 'min_amount', label: 'Minimum Amount', type: 'number', placeholder: 'Enter minimum' },
      { name: 'max_amount', label: 'Maximum Amount', type: 'number', placeholder: 'Enter maximum' }
    ],
    sampleData: Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      name: `Scale ${String.fromCharCode(65 + (i % 10))}`,
      code: `SAL${String(i + 1).padStart(3, '0')}`,
      min_amount: 50000 + (i * 5000),
      max_amount: 100000 + (i * 10000),
      status: i % 7 === 0 ? 'Inactive' : 'Active'
    }))
  },
  'school-category': {
    title: 'School Categories',
    description: 'Manage school categories',
    icon: '📚',
    fields: [
      { name: 'name', label: 'Category Name', required: true, placeholder: 'Enter category name' },
      { name: 'code', label: 'Code', required: true, placeholder: 'Enter code' },
      { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Enter description' }
    ],
    sampleData: Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      name: ['Primary School', 'Secondary School', 'High School', 'Technical School', 'Vocational School', 'Special Education', 'International School', 'Online School'][i % 8],
      code: `SCT${String(i + 1).padStart(3, '0')}`,
      description: `School category description ${i + 1}`,
      status: i % 6 === 0 ? 'Inactive' : 'Active'
    }))
  },
  'school-classification': {
    title: 'School Classifications',
    description: 'Manage school classification types',
    icon: '🏷️',
    fields: [
      { name: 'name', label: 'Classification Name', required: true, placeholder: 'Enter classification' },
      { name: 'code', label: 'Code', required: true, placeholder: 'Enter code' },
      { name: 'grade', label: 'Grade', type: 'select', options: ['Grade A', 'Grade B', 'Grade C', 'Grade D', 'Not Graded'] }
    ],
    sampleData: Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      name: ['Top Tier', 'Second Tier', 'Third Tier', 'Emerging', 'Developing', 'Established', 'Premier', 'Standard'][i % 8],
      code: `SCL${String(i + 1).padStart(3, '0')}`,
      grade: ['Grade A', 'Grade B', 'Grade C', 'Grade D', 'Not Graded'][i % 5],
      status: i % 7 === 0 ? 'Inactive' : 'Active'
    }))
  },
  'school-owner': {
    title: 'School Owners',
    description: 'Manage school ownership information',
    icon: '🏠',
    fields: [
      { name: 'name', label: 'Owner Name', required: true, placeholder: 'Enter owner name' },
      { name: 'code', label: 'Code', required: true, placeholder: 'Enter code' },
      { name: 'type', label: 'Owner Type', type: 'select', options: ['Government', 'Private Individual', 'Organization', 'Trust', 'Religious Body', 'NGO'] }
    ],
    sampleData: Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      name: `Owner ${i + 1}`,
      code: `OWN${String(i + 1).padStart(3, '0')}`,
      type: ['Government', 'Private Individual', 'Organization', 'Trust', 'Religious Body', 'NGO'][i % 6],
      status: i % 8 === 0 ? 'Inactive' : 'Active'
    }))
  },
  'school-gender-type': {
    title: 'School Gender Types',
    description: 'Manage school gender admission types',
    icon: '⚧️',
    fields: [
      { name: 'name', label: 'Gender Type', required: true, placeholder: 'Enter gender type' },
      { name: 'code', label: 'Code', required: true, placeholder: 'Enter code' }
    ],
    sampleData: [
      { id: 1, name: 'Boys Only', code: 'BOY', status: 'Active' },
      { id: 2, name: 'Girls Only', code: 'GRL', status: 'Active' },
      { id: 3, name: 'Co-Educational', code: 'COED', status: 'Active' },
      { id: 4, name: 'Mixed', code: 'MIX', status: 'Active' }
    ]
  },
  'school-specialization': {
    title: 'School Specializations',
    description: 'Manage school specialization areas',
    icon: '🎯',
    fields: [
      { name: 'name', label: 'Specialization', required: true, placeholder: 'Enter specialization' },
      { name: 'code', label: 'Code', required: true, placeholder: 'Enter code' },
      { name: 'category', label: 'Category', type: 'select', options: ['Science', 'Arts', 'Commerce', 'Technical', 'Sports', 'Other'] }
    ],
    sampleData: Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      name: ['Science & Technology', 'Languages', 'Business Studies', 'Engineering', 'Medical Sciences', 'Arts & Humanities', 'Sports Academy', 'Information Technology'][i % 8],
      code: `SPC${String(i + 1).padStart(3, '0')}`,
      category: ['Science', 'Arts', 'Commerce', 'Technical', 'Sports', 'Other'][i % 6],
      status: i % 7 === 0 ? 'Inactive' : 'Active'
    }))
  },
  'school-type': {
    title: 'School Types',
    description: 'Manage different school types',
    icon: '🏫',
    fields: [
      { name: 'name', label: 'School Type', required: true, placeholder: 'Enter school type' },
      { name: 'code', label: 'Code', required: true, placeholder: 'Enter code' },
      { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Enter description' }
    ],
    sampleData: Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      name: ['Day School', 'Boarding School', 'Day & Boarding', 'Online School', 'Homeschool', 'Charter School', 'Magnet School', 'Academy'][i % 8],
      code: `STY${String(i + 1).padStart(3, '0')}`,
      description: `School type description ${i + 1}`,
      status: i % 6 === 0 ? 'Inactive' : 'Active'
    }))
  },
  'sponsorship-type': {
    title: 'Sponsorship Types',
    description: 'Manage student sponsorship types',
    icon: '🤝',
    fields: [
      { name: 'name', label: 'Sponsorship Type', required: true, placeholder: 'Enter sponsorship type' },
      { name: 'code', label: 'Code', required: true, placeholder: 'Enter code' },
      { name: 'coverage', label: 'Coverage', type: 'select', options: ['Full', 'Partial', 'Custom'] }
    ],
    sampleData: Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      name: ['Government Scholarship', 'Private Scholarship', 'Merit-Based', 'Need-Based', 'Sports Scholarship', 'Academic Excellence', 'Community Service', 'Alumni Sponsorship'][i % 8],
      code: `SPN${String(i + 1).padStart(3, '0')}`,
      coverage: ['Full', 'Partial', 'Custom'][i % 3],
      status: i % 7 === 0 ? 'Inactive' : 'Active'
    }))
  },
  'service-type': {
    title: 'Service Types',
    description: 'Manage school service types',
    icon: '🛠️',
    fields: [
      { name: 'name', label: 'Service Type', required: true, placeholder: 'Enter service type' },
      { name: 'code', label: 'Code', required: true, placeholder: 'Enter code' },
      { name: 'category', label: 'Category', type: 'select', options: ['Academic', 'Administrative', 'Support', 'Extra-Curricular', 'Other'] }
    ],
    sampleData: Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      name: ['Teaching', 'Counseling', 'Library Services', 'IT Support', 'Health Services', 'Transportation', 'Catering', 'Maintenance'][i % 8],
      code: `SRV${String(i + 1).padStart(3, '0')}`,
      category: ['Academic', 'Administrative', 'Support', 'Extra-Curricular', 'Other'][i % 5],
      status: i % 6 === 0 ? 'Inactive' : 'Active'
    }))
  },
  'staff-type': {
    title: 'Staff Types',
    description: 'Manage staff employment types',
    icon: '👨‍💼',
    fields: [
      { name: 'name', label: 'Staff Type', required: true, placeholder: 'Enter staff type' },
      { name: 'code', label: 'Code', required: true, placeholder: 'Enter code' },
      { name: 'employment', label: 'Employment', type: 'select', options: ['Full-Time', 'Part-Time', 'Contract', 'Temporary', 'Volunteer'] }
    ],
    sampleData: Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      name: ['Permanent', 'Contractual', 'Temporary', 'Part-Time', 'Visiting', 'Guest', 'Volunteer', 'Intern'][i % 8],
      code: `STF${String(i + 1).padStart(3, '0')}`,
      employment: ['Full-Time', 'Part-Time', 'Contract', 'Temporary', 'Volunteer'][i % 5],
      status: i % 7 === 0 ? 'Inactive' : 'Active'
    }))
  },
  'special-need-type': {
    title: 'Special Need Types',
    description: 'Manage special educational needs',
    icon: '♿',
    fields: [
      { name: 'name', label: 'Special Need', required: true, unique: true, placeholder: 'Enter special need type' },
      { name: 'code', label: 'Code', required: true, placeholder: 'Enter code' },
      { name: 'category', label: 'Category', type: 'select', options: ['Physical', 'Learning', 'Behavioral', 'Sensory', 'Other'] }
    ],
    sampleData: Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      name: ['Visual Impairment', 'Hearing Impairment', 'Physical Disability', 'Learning Disability', 'Autism', 'Speech Disorder', 'ADHD', 'Dyslexia'][i % 8],
      code: `SPN${String(i + 1).padStart(3, '0')}`,
      category: ['Physical', 'Learning', 'Behavioral', 'Sensory', 'Other'][i % 5],
      status: i % 6 === 0 ? 'Inactive' : 'Active'
    }))
  },
  'ssv-initiator': {
    title: 'SSV Initiators',
    description: 'Manage School Self-evaluation initiators',
    icon: '🔍',
    fields: [
      { name: 'name', label: 'Initiator Name', required: true, placeholder: 'Enter initiator name' },
      { name: 'code', label: 'Code', required: true, placeholder: 'Enter code' },
      { name: 'role', label: 'Role', type: 'select', options: ['Principal', 'Deputy Principal', 'Head of Department', 'Quality Assurance Officer', 'External Auditor'] }
    ],
    sampleData: Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      name: `Initiator ${i + 1}`,
      code: `SSI${String(i + 1).padStart(3, '0')}`,
      role: ['Principal', 'Deputy Principal', 'Head of Department', 'Quality Assurance Officer', 'External Auditor'][i % 5],
      status: i % 7 === 0 ? 'Inactive' : 'Active'
    }))
  },
  'ssv-type': {
    title: 'SSV Types',
    description: 'Manage School Self-evaluation types',
    icon: '📊',
    fields: [
      { name: 'name', label: 'SSV Type', required: true, placeholder: 'Enter SSV type' },
      { name: 'code', label: 'Code', required: true, placeholder: 'Enter code' },
      { name: 'frequency', label: 'Frequency', type: 'select', options: ['Annual', 'Semi-Annual', 'Quarterly', 'Monthly', 'Ad-hoc'] }
    ],
    sampleData: Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      name: ['Academic Performance', 'Infrastructure', 'Staff Development', 'Student Welfare', 'Financial Management', 'Governance', 'Safety & Security', 'Community Relations'][i % 8],
      code: `SST${String(i + 1).padStart(3, '0')}`,
      frequency: ['Annual', 'Semi-Annual', 'Quarterly', 'Monthly', 'Ad-hoc'][i % 5],
      status: i % 6 === 0 ? 'Inactive' : 'Active'
    }))
  },
  'subject-category': {
    title: 'Subject Categories',
    description: 'Manage subject categories',
    icon: '📖',
    fields: [
      { name: 'name', label: 'Category Name', required: true, unique: true, placeholder: 'Enter category name' },
      { name: 'code', label: 'Code', required: true, placeholder: 'Enter code' },
      { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Enter description' }
    ],
    sampleData: Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      name: ['Sciences', 'Mathematics', 'Languages', 'Social Studies', 'Arts', 'Physical Education', 'Technology', 'Vocational'][i % 8],
      code: `SBC${String(i + 1).padStart(3, '0')}`,
      description: `Subject category description ${i + 1}`,
      status: i % 7 === 0 ? 'Inactive' : 'Active'
    }))
  },
  'subject': {
    title: 'Subjects',
    description: 'Manage academic subjects',
    icon: '📚',
    fields: [
      { name: 'name', label: 'Subject Name', required: true, unique: true, placeholder: 'Enter subject name' },
      { name: 'code', label: 'Code', required: true, placeholder: 'Enter code' },
      { name: 'category', label: 'Category', type: 'select', options: ['Core', 'Elective', 'Optional', 'Compulsory'] }
    ],
    sampleData: Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      name: ['Mathematics', 'English', 'Physics', 'Chemistry', 'Biology', 'History', 'Geography', 'Computer Science', 'Economics', 'Literature'][i % 10],
      code: `SUB${String(i + 1).padStart(3, '0')}`,
      category: ['Core', 'Elective', 'Optional', 'Compulsory'][i % 4],
      status: i % 8 === 0 ? 'Inactive' : 'Active'
    }))
  },
  'years': {
    title: 'Years',
    description: 'Manage academic years',
    icon: '📅',
    fields: [
      { name: 'name', label: 'Year Name', required: true, unique: true, placeholder: 'Enter year name' },
      { name: 'code', label: 'Code', required: true, placeholder: 'Enter code' },
      { name: 'start_date', label: 'Start Date', type: 'date', placeholder: 'Select start date' },
      { name: 'end_date', label: 'End Date', type: 'date', placeholder: 'Select end date' }
    ],
    sampleData: Array.from({ length: 20 }, (_, i) => {
      const year = 2020 + i;
      return {
        id: i + 1,
        name: `${year}/${year + 1}`,
        code: `AY${year}`,
        start_date: `${year}-09-01`,
        end_date: `${year + 1}-06-30`,
        status: i === 0 ? 'Active' : 'Inactive'
      };
    })
  },
  
  // Geographical Location configurations
  'geographical-level': {
    title: 'Geographical Levels',
    description: 'Manage geographical hierarchy levels',
    icon: '🌍',
    fields: [
      { name: 'name', label: 'Level Name', required: true, placeholder: 'Enter level name' },
      { name: 'code', label: 'Level Code', required: true, placeholder: 'Enter level code' },
      { name: 'order', label: 'Hierarchy Order', type: 'number', placeholder: 'Enter order' },
      { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Enter description' }
    ],
    sampleData: Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      name: ['Country', 'Region', 'District', 'Council', 'Ward', 'Village', 'Zone', 'Sub-locality'][i % 8],
      code: `GL${String(i + 1).padStart(3, '0')}`,
      order: (i % 8) + 1,
      description: `Geographical level ${i + 1} description`,
      status: i % 7 === 0 ? 'Inactive' : 'Active'
    }))
  },
  'country': {
    title: 'Countries',
    description: 'Manage country records',
    icon: '🗺️',
    fields: [
      { name: 'name', label: 'Country Name', required: true, placeholder: 'Enter country name' },
      { name: 'code', label: 'Country Code', required: true, placeholder: 'Enter ISO code' },
      { name: 'iso_code', label: 'ISO Code', required: true, placeholder: 'Enter 2-letter ISO code' },
      { name: 'phone_code', label: 'Phone Code', placeholder: 'Enter phone code (e.g., +255)' },
      { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Enter description' }
    ],
    sampleData: Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      name: ['Tanzania', 'Kenya', 'Uganda', 'Rwanda', 'Burundi', 'South Sudan', 'DR Congo', 'Malawi', 'Zambia', 'Mozambique'][i % 10],
      code: `CTY${String(i + 1).padStart(3, '0')}`,
      iso_code: ['TZ', 'KE', 'UG', 'RW', 'BI', 'SS', 'CD', 'MW', 'ZM', 'MZ'][i % 10],
      phone_code: ['+255', '+254', '+256', '+250', '+257', '+211', '+243', '+265', '+260', '+258'][i % 10],
      description: `Country information for ${i + 1}`,
      status: i % 8 === 0 ? 'Inactive' : 'Active'
    }))
  },
  'region': {
    title: 'Regions',
    description: 'Manage regional administrative divisions',
    icon: '📍',
    fields: [
      { name: 'name', label: 'Region Name', required: true, placeholder: 'Enter region name' },
      { name: 'code', label: 'Region Code', required: true, placeholder: 'Enter region code' },
      { name: 'country', label: 'Country', required: true, type: 'select', options: ['Tanzania', 'Kenya', 'Uganda', 'Other'] },
      { name: 'population', label: 'Population', type: 'number', placeholder: 'Enter population' },
      { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Enter description' }
    ],
    sampleData: Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      name: ['Dar es Salaam', 'Arusha', 'Mwanza', 'Dodoma', 'Kilimanjaro', 'Mbeya', 'Morogoro', 'Tanga', 'Mara', 'Kagera'][i % 10],
      code: `RGN${String(i + 1).padStart(3, '0')}`,
      country: 'Tanzania',
      population: 1000000 + (i * 250000),
      description: `Region information for ${i + 1}`,
      status: i % 6 === 0 ? 'Inactive' : 'Active'
    }))
  },
  'district': {
    title: 'Districts',
    description: 'Manage district administrative divisions',
    icon: '🏛️',
    fields: [
      { name: 'name', label: 'District Name', required: true, placeholder: 'Enter district name' },
      { name: 'code', label: 'District Code', required: true, placeholder: 'Enter district code' },
      { name: 'region', label: 'Region', required: true, type: 'select', options: ['Dar es Salaam', 'Arusha', 'Mwanza', 'Dodoma', 'Other'] },
      { name: 'area_sqkm', label: 'Area (sq km)', type: 'number', placeholder: 'Enter area' },
      { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Enter description' }
    ],
    sampleData: Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      name: ['Kinondoni', 'Ilala', 'Temeke', 'Kigamboni', 'Ubungo', 'Arusha City', 'Karatu', 'Monduli', 'Ngorongoro', 'Meru'][i % 10],
      code: `DST${String(i + 1).padStart(3, '0')}`,
      region: ['Dar es Salaam', 'Arusha', 'Mwanza', 'Dodoma'][i % 4],
      area_sqkm: 500 + (i * 100),
      description: `District information for ${i + 1}`,
      status: i % 5 === 0 ? 'Inactive' : 'Active'
    }))
  },
  'council': {
    title: 'Councils',
    description: 'Manage council administrative units',
    icon: '🏢',
    fields: [
      { name: 'name', label: 'Council Name', required: true, placeholder: 'Enter council name' },
      { name: 'code', label: 'Council Code', required: true, placeholder: 'Enter council code' },
      { name: 'district', label: 'District', required: true, type: 'select', options: ['Kinondoni', 'Ilala', 'Temeke', 'Other'] },
      { name: 'type', label: 'Council Type', required: true, type: 'select', options: ['Municipal', 'District', 'Town', 'City'] },
      { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Enter description' }
    ],
    sampleData: Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      name: ['Kinondoni Municipal', 'Ilala Municipal', 'Temeke Municipal', 'Kigamboni District', 'Ubungo Municipal'][i % 5],
      code: `CNC${String(i + 1).padStart(3, '0')}`,
      district: ['Kinondoni', 'Ilala', 'Temeke'][i % 3],
      type: ['Municipal', 'District', 'Town', 'City'][i % 4],
      description: `Council information for ${i + 1}`,
      status: i % 6 === 0 ? 'Inactive' : 'Active'
    }))
  },
  'ward': {
    title: 'Wards',
    description: 'Manage ward administrative units',
    icon: '🏘️',
    fields: [
      { name: 'name', label: 'Ward Name', required: true, placeholder: 'Enter ward name' },
      { name: 'code', label: 'Ward Code', required: true, placeholder: 'Enter ward code' },
      { name: 'council', label: 'Council', required: true, type: 'select', options: ['Kinondoni Municipal', 'Ilala Municipal', 'Temeke Municipal', 'Other'] },
      { name: 'population', label: 'Population', type: 'number', placeholder: 'Enter population' },
      { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Enter description' }
    ],
    sampleData: Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      name: ['Kawe', 'Mikocheni', 'Msasani', 'Mwananyamala', 'Sinza', 'Tandale', 'Bunju', 'Goba', 'Kimara', 'Kwembe'][i % 10],
      code: `WRD${String(i + 1).padStart(3, '0')}`,
      council: ['Kinondoni Municipal', 'Ilala Municipal', 'Temeke Municipal'][i % 3],
      population: 10000 + (i * 5000),
      description: `Ward information for ${i + 1}`,
      status: i % 7 === 0 ? 'Inactive' : 'Active'
    }))
  }
};

// Function to get configuration for a specific page
export const getSetupConfig = (pageId) => {
  return setupConfig[pageId] || null;
};
