import { gql } from '@apollo/client';

export const GET_SCHOOL_BY_CODE = gql`
  query GetSchoolByCode($code: String!) {
    getSchoolByCode(code: $code) {
      id
      name
      schoolName
      slug
      schoolCode
      logo
      schoolLogo
      themeColor
      subscriptionPlan
      subscriptionStatus
      status
    }
  }
`;

export const LOGIN_WITH_PASSWORD = gql`
  mutation LoginWithPassword($email: String!, $password: String!, $schoolId: ID) {
    loginWithPassword(email: $email, password: $password, schoolId: $schoolId) {
      token
      refreshToken
      user {
        id
        name
        firstName
        lastName
        email
        role
        schoolId
        phone
        mobile
        avatar
      }
    }
  }
`;

export const SEND_OTP = gql`
  mutation SendOTP($mobile: String!, $schoolId: ID!) {
    sendOTP(mobile: $mobile, schoolId: $schoolId)
  }
`;

export const VERIFY_OTP = gql`
  mutation VerifyOTP($mobile: String!, $otp: String!, $schoolId: ID!) {
    verifyOTP(mobile: $mobile, otp: $otp, schoolId: $schoolId) {
      token
      refreshToken
      user {
        id
        name
        firstName
        lastName
        email
        role
        schoolId
        phone
        mobile
        avatar
      }
    }
  }
`;

export const LOGIN_MUTATION = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      refreshToken
      user {
        id
        name
        email
        role
        schoolId
        phone
        avatar
      }
    }
  }
`;

export const GET_ME_QUERY = gql`
  query GetMe {
    getMe {
      id
      name
      email
      role
      schoolId
      phone
      avatar
    }
  }
`;

export const GET_SUPER_ADMIN_DASHBOARD = gql`
  query GetSuperAdminDashboard {
    getSuperAdminDashboard {
      totalSchools
      totalStudents
      totalTeachers
      activeSchools
      expiredSubscriptions
      monthlyRevenue
      annualRevenue
      monthlyRevenueSeries {
        month
        revenue
      }
    }
  }
`;

export const GET_SCHOOL_ADMIN_DASHBOARD = gql`
  query GetSchoolAdminDashboard($startDate: Date, $endDate: Date) {
    getSchoolAdminDashboard(startDate: $startDate, endDate: $endDate) {
      studentCount
      teacherCount
      staffCount
      attendanceSummary {
        presentPercent
        absentPercent
        latePercent
      }
      teacherAttendanceSummary {
        presentPercent
        absentPercent
        latePercent
      }
      staffAttendanceSummary {
        presentPercent
        absentPercent
        latePercent
      }
      feeCollectionSummary {
        totalExpected
        totalCollected
        totalOutstanding
      }
      classEnrollmentSummary {
        className
        studentCount
      }
      gradeDistribution {
        grade
        count
      }
      upcomingExamsCount
      absentTeachers {
        id
        firstName
        lastName
        status
        remarks
      }
      copySubmissionSummary {
        className
        subjectName
        completedCount
        totalCount
        completionRate
      }
      libraryStats {
        totalBooks
        totalIssuedBooks
      }
      leaveStats {
        pendingCount
        approvedCount
        rejectedCount
      }
      homeworkStats {
        totalHomework
        totalSubmissions
      }
      facultyAttendanceTrend {
        date
        presentTeachers
        absentTeachers
        presentStaff
        absentStaff
      }
    }
  }
`;

export const GET_CLASSES = gql`
  query GetClasses {
    getClasses {
      id
      name
      code
      description
    }
  }
`;

export const GET_SECTIONS = gql`
  query GetSections($classId: ID) {
    getSections(classId: $classId) {
      id
      name
      roomNumber
      capacity
      classId {
        id
        name
      }
      classTeacherId {
        id
        firstName
        lastName
      }
    }
  }
`;

export const GET_SUBJECTS = gql`
  query GetSubjects($classId: ID) {
    getSubjects(classId: $classId) {
      id
      name
      code
      type
      classId {
        id
        name
      }
    }
  }
`;

export const GET_STUDENTS = gql`
  query GetStudents($classId: ID, $sectionId: ID, $search: String) {
    getStudents(classId: $classId, sectionId: $sectionId, search: $search) {
      id
      userId {
        id
        email
        avatar
      }
      admissionNo
      rollNo
      firstName
      lastName
      gender
      dateOfBirth
      classId {
        id
        name
      }
      sectionId {
        id
        name
      }
      parentId {
        id
        firstName
        lastName
      }
      branch
      category
      mobileNumber
      house
      height
      weight
      apaarId
      rteNumber
      penNumber
      aadhaarFront
      aadhaarBack
      permanentAddress
      fatherOccupation
      motherName
      motherOccupation
      motherPhone
      guardianName
      guardianPhone
      admissionFee
      tuitionFee
      transportFee
      hostelFee
      otherFee
      dueDate
      totalDiscount
      discountType
      installmentPlan
      prevSchoolName
      prevClass
      passingYear
      bloodGroup
      address {
        street
        city
        state
        zipCode
        country
      }
    }
  }
`;

export const REGISTER_STUDENT = gql`
  mutation RegisterStudent(
    $email: String!
    $admissionNo: String!
    $rollNo: String
    $firstName: String!
    $lastName: String!
    $gender: String!
    $dateOfBirth: Date!
    $classId: ID!
    $sectionId: ID!
    $parentId: ID
    $address: AddressInput
    $medicalInfo: MedicalInfoInput
    $avatar: String
    $parentEmail: String
    $parentFirstName: String
    $parentLastName: String
    $parentRelation: String
    $parentPhone: String
    $parentPassword: String
    $branch: String
    $category: String
    $mobileNumber: String
    $house: String
    $height: Float
    $weight: Float
    $apaarId: String
    $rteNumber: String
    $penNumber: String
    $aadhaarFront: String
    $aadhaarBack: String
    $permanentAddress: String
    $fatherOccupation: String
    $motherName: String
    $motherOccupation: String
    $motherPhone: String
    $guardianName: String
    $guardianPhone: String
    $admissionFee: Float
    $tuitionFee: Float
    $transportFee: Float
    $hostelFee: Float
    $otherFee: Float
    $dueDate: Date
    $totalDiscount: Float
    $discountType: String
    $installmentPlan: String
    $prevSchoolName: String
    $prevClass: String
    $passingYear: String
    $bloodGroup: String
  ) {
    registerStudent(
      email: $email
      admissionNo: $admissionNo
      rollNo: $rollNo
      firstName: $firstName
      lastName: $lastName
      gender: $gender
      dateOfBirth: $dateOfBirth
      classId: $classId
      sectionId: $sectionId
      parentId: $parentId
      address: $address
      medicalInfo: $medicalInfo
      avatar: $avatar
      parentEmail: $parentEmail
      parentFirstName: $parentFirstName
      parentLastName: $parentLastName
      parentRelation: $parentRelation
      parentPhone: $parentPhone
      parentPassword: $parentPassword
      branch: $branch
      category: $category
      mobileNumber: $mobileNumber
      house: $house
      height: $height
      weight: $weight
      apaarId: $apaarId
      rteNumber: $rteNumber
      penNumber: $penNumber
      aadhaarFront: $aadhaarFront
      aadhaarBack: $aadhaarBack
      permanentAddress: $permanentAddress
      fatherOccupation: $fatherOccupation
      motherName: $motherName
      motherOccupation: $motherOccupation
      motherPhone: $motherPhone
      guardianName: $guardianName
      guardianPhone: $guardianPhone
      admissionFee: $admissionFee
      tuitionFee: $tuitionFee
      transportFee: $transportFee
      hostelFee: $hostelFee
      otherFee: $otherFee
      dueDate: $dueDate
      totalDiscount: $totalDiscount
      discountType: $discountType
      installmentPlan: $installmentPlan
      prevSchoolName: $prevSchoolName
      prevClass: $prevClass
      passingYear: $passingYear
      bloodGroup: $bloodGroup
    ) {
      id
      admissionNo
      firstName
      lastName
    }
  }
`;

export const UPDATE_STUDENT = gql`
  mutation UpdateStudent(
    $id: ID!
    $email: String
    $admissionNo: String
    $rollNo: String
    $firstName: String
    $lastName: String
    $gender: String
    $dateOfBirth: Date
    $classId: ID
    $sectionId: ID
    $parentId: ID
    $branch: String
    $category: String
    $mobileNumber: String
    $house: String
    $height: Float
    $weight: Float
    $apaarId: String
    $rteNumber: String
    $penNumber: String
    $aadhaarFront: String
    $aadhaarBack: String
    $permanentAddress: String
    $fatherOccupation: String
    $motherName: String
    $motherOccupation: String
    $motherPhone: String
    $guardianName: String
    $guardianPhone: String
    $admissionFee: Float
    $tuitionFee: Float
    $transportFee: Float
    $hostelFee: Float
    $otherFee: Float
    $dueDate: Date
    $totalDiscount: Float
    $discountType: String
    $installmentPlan: String
    $prevSchoolName: String
    $prevClass: String
    $passingYear: String
    $bloodGroup: String
  ) {
    updateStudent(
      id: $id
      email: $email
      admissionNo: $admissionNo
      rollNo: $rollNo
      firstName: $firstName
      lastName: $lastName
      gender: $gender
      dateOfBirth: $dateOfBirth
      classId: $classId
      sectionId: $sectionId
      parentId: $parentId
      branch: $branch
      category: $category
      mobileNumber: $mobileNumber
      house: $house
      height: $height
      weight: $weight
      apaarId: $apaarId
      rteNumber: $rteNumber
      penNumber: $penNumber
      aadhaarFront: $aadhaarFront
      aadhaarBack: $aadhaarBack
      permanentAddress: $permanentAddress
      fatherOccupation: $fatherOccupation
      motherName: $motherName
      motherOccupation: $motherOccupation
      motherPhone: $motherPhone
      guardianName: $guardianName
      guardianPhone: $guardianPhone
      admissionFee: $admissionFee
      tuitionFee: $tuitionFee
      transportFee: $transportFee
      hostelFee: $hostelFee
      otherFee: $otherFee
      dueDate: $dueDate
      totalDiscount: $totalDiscount
      discountType: $discountType
      installmentPlan: $installmentPlan
      prevSchoolName: $prevSchoolName
      prevClass: $prevClass
      passingYear: $passingYear
      bloodGroup: $bloodGroup
    ) {
      id
      admissionNo
      rollNo
      firstName
      lastName
      gender
      dateOfBirth
      userId {
        id
        email
      }
      classId {
        id
        name
      }
      sectionId {
        id
        name
      }
      parentId {
        id
        firstName
        lastName
      }
    }
  }
`;

export const DELETE_STUDENT = gql`
  mutation DeleteStudent($id: ID!) {
    deleteStudent(id: $id)
  }
`;

export const GET_TEACHERS = gql`
  query GetTeachers {
    getTeachers {
      id
      firstName
      lastName
      phone
      email
      qualification
      designation
      userId {
        id
        email
        avatar
        role
      }
    }
  }
`;

export const GET_STAFF = gql`
  query GetStaff {
    getStaff {
      id
      firstName
      lastName
      gender
      phone
      email
      department
      designation
      userId {
        id
        email
        role
      }
    }
  }
`;

export const REGISTER_TEACHER = gql`
  mutation RegisterTeacher(
    $email: String!
    $firstName: String!
    $lastName: String!
    $gender: String!
    $dateOfBirth: Date!
    $phone: String!
    $qualification: String!
    $designation: String
    $password: String!
    $avatar: String
    $role: String
  ) {
    registerTeacher(
      email: $email
      firstName: $firstName
      lastName: $lastName
      gender: $gender
      dateOfBirth: $dateOfBirth
      phone: $phone
      qualification: $qualification
      designation: $designation
      password: $password
      avatar: $avatar
      role: $role
    ) {
      id
      firstName
      lastName
      email
    }
  }
`;

export const REGISTER_PARENT = gql`
  mutation RegisterParent(
    $email: String!
    $firstName: String!
    $lastName: String!
    $relation: String!
    $phone: String!
    $password: String!
    $address: AddressInput
    $childrenIds: [ID!]
  ) {
    registerParent(
      email: $email
      firstName: $firstName
      lastName: $lastName
      relation: $relation
      phone: $phone
      password: $password
      address: $address
      childrenIds: $childrenIds
    ) {
      id
      firstName
      lastName
      relation
      phone
      email
    }
  }
`;

export const GET_PARENTS = gql`
  query GetParents {
    getParents {
      id
      firstName
      lastName
      relation
      phone
      email
      userId {
        id
        email
      }
    }
  }
`;

export const GET_FEES_LIST = gql`
  query GetFeesList($classId: ID) {
    getFeesList(classId: $classId) {
      id
      title
      category
      amount
      dueDate
      academicYear
      classId {
        id
        name
      }
    }
  }
`;

export const GET_STUDENT_FEE_LEDGER = gql`
  query GetStudentFeeLedger($classId: ID, $studentId: ID) {
    getStudentFeeLedger(classId: $classId, studentId: $studentId) {
      studentId
      studentName
      admissionNo
      className
      totalPayable
      totalPaid
      outstanding
      componentsBreakdown {
        componentId
        name
        category
        totalDue
        totalPaid
        remaining
      }
    }
  }
`;

export const CREATE_FEE_STRUCTURE = gql`
  mutation CreateFeeStructure(
    $title: String!
    $category: String!
    $amount: Float!
    $classId: ID!
    $dueDate: Date!
    $academicYear: String!
    $description: String
  ) {
    createFeeStructure(
      title: $title
      category: $category
      amount: $amount
      classId: $classId
      dueDate: $dueDate
      academicYear: $academicYear
      description: $description
    ) {
      id
      title
      amount
      dueDate
    }
  }
`;

export const COLLECT_STUDENT_FEE = gql`
  mutation CollectStudentFee(
    $studentId: ID!
    $feeId: ID!
    $amountPaid: Float!
    $paymentMethod: String!
    $referenceNo: String
    $remarks: String
  ) {
    collectStudentFee(
      studentId: $studentId
      feeId: $feeId
      amountPaid: $amountPaid
      paymentMethod: $paymentMethod
      referenceNo: $referenceNo
      remarks: $remarks
    ) {
      id
      amountPaid
      paymentDate
      receiptNo
    }
  }
`;

export const GET_AUDIT_LOGS = gql`
  query GetAuditLogs {
    getGlobalAuditLogs {
      id
      action
      details
      ipAddress
      createdAt
      userId {
        id
        name
        role
      }
    }
  }
`;

export const GET_SCHOOL = gql`
  query GetSchool($id: ID!) {
    getSchool(id: $id) {
      id
      name
      schoolName
      logo
      schoolLogo
      address {
        street
        city
        state
        zipCode
        country
      }
      settings {
        featurePermissions {
          SUPER_TEACHER
          ACCOUNTANT
          TEACHER
          PARENT
        }
      }
    }
  }
`;

export const UPDATE_SCHOOL_PERMISSIONS = gql`
  mutation UpdateSchoolPermissions($schoolId: ID!, $permissions: RolePermissionsInput!) {
    updateSchoolPermissions(schoolId: $schoolId, permissions: $permissions) {
      id
      settings {
        featurePermissions {
          SUPER_TEACHER
          ACCOUNTANT
          TEACHER
          PARENT
        }
      }
    }
  }
`;

export const GET_SCHOOLS = gql`
  query GetSchools {
    getSchools {
      id
      name
      slug
      status
      logo
      schoolLogo
      address {
        street
        city
        state
        zipCode
        country
      }
      subscription {
        plan
        status
        endDate
      }
      contact {
        email
        phone
      }
      createdAt
    }
  }
`;

export const CREATE_SCHOOL = gql`
  mutation CreateSchool(
    $name: String!
    $slug: String!
    $schoolCode: String!
    $contactEmail: String!
    $contactPhone: String!
    $plan: String!
    $adminName: String!
    $adminEmail: String!
    $adminPassword: String!
    $address: AddressInput
    $logo: String
    $schoolLogo: String
  ) {
    createSchool(
      name: $name
      slug: $slug
      schoolCode: $schoolCode
      contactEmail: $contactEmail
      contactPhone: $contactPhone
      plan: $plan
      adminName: $adminName
      adminEmail: $adminEmail
      adminPassword: $adminPassword
      address: $address
      logo: $logo
      schoolLogo: $schoolLogo
    ) {
      id
      name
      slug
      status
      logo
      schoolLogo
    }
  }
`;

export const UPDATE_SCHOOL = gql`
  mutation UpdateSchool($id: ID!, $name: String, $plan: String, $status: String, $address: AddressInput, $logo: String, $schoolLogo: String) {
    updateSchool(id: $id, name: $name, plan: $plan, status: $status, address: $address, logo: $logo, schoolLogo: $schoolLogo) {
      id
      name
      status
      logo
      schoolLogo
      subscription {
        plan
        status
        endDate
      }
      contact {
        email
        phone
      }
    }
  }
`;

export const CREATE_CLASS = gql`
  mutation CreateClass($name: String!, $code: String!, $description: String) {
    createClass(name: $name, code: $code, description: $description) {
      id
      name
      code
    }
  }
`;

export const CREATE_SECTION = gql`
  mutation CreateSection($classId: ID!, $name: String!, $roomNumber: String, $capacity: Int, $classTeacherId: ID) {
    createSection(classId: $classId, name: $name, roomNumber: $roomNumber, capacity: $capacity, classTeacherId: $classTeacherId) {
      id
      name
    }
  }
`;

export const CREATE_SUBJECT = gql`
  mutation CreateSubject($classId: ID!, $name: String!, $code: String!, $type: String!) {
    createSubject(classId: $classId, name: $name, code: $code, type: $type) {
      id
      name
      code
    }
  }
`;

export const GET_STUDENT_ATTENDANCE = gql`
  query GetStudentAttendance($classId: ID!, $sectionId: ID!, $date: Date!) {
    getStudentAttendance(classId: $classId, sectionId: $sectionId, date: $date) {
      id
      status
      remarks
      studentId {
        id
        firstName
        lastName
        rollNo
      }
    }
  }
`;

export const MARK_BULK_ATTENDANCE = gql`
  mutation MarkBulkAttendance($classId: ID!, $sectionId: ID!, $date: Date!, $records: [BulkAttendanceInput!]!) {
    markBulkAttendance(classId: $classId, sectionId: $sectionId, date: $date, records: $records)
  }
`;

export const GET_HOMEWORK = gql`
  query GetHomework($classId: ID!, $sectionId: ID!) {
    getHomework(classId: $classId, sectionId: $sectionId) {
      id
      title
      description
      dueDate
      subjectId {
        id
        name
      }
      teacherId {
        id
        firstName
        lastName
      }
      classId {
        id
        name
      }
      sectionId {
        id
        name
      }
    }
  }
`;

export const CREATE_HOMEWORK = gql`
  mutation CreateHomework(
    $title: String!
    $description: String!
    $classId: ID!
    $sectionId: ID!
    $subjectId: ID!
    $teacherId: ID
    $dueDate: Date!
  ) {
    createHomework(
      title: $title
      description: $description
      classId: $classId
      sectionId: $sectionId
      subjectId: $subjectId
      teacherId: $teacherId
      dueDate: $dueDate
    ) {
      id
      title
    }
  }
`;

export const FORGOT_PASSWORD = gql`
  mutation ForgotPassword($email: String!) {
    forgotPassword(email: $email)
  }
`;

export const GET_PARENT_PROFILE = gql`
  query GetParentProfile {
    getParentProfile {
      id
      firstName
      lastName
      relation
      phone
      email
      children {
        id
        firstName
        lastName
        admissionNo
        rollNo
        classId {
          id
          name
        }
        sectionId {
          id
          name
        }
      }
    }
  }
`;

export const GET_STUDENT_ATTENDANCE_SUMMARY = gql`
  query GetStudentAttendanceSummary($studentId: ID!) {
    getStudentAttendanceSummary(studentId: $studentId) {
      presentPercent
      absentPercent
      latePercent
    }
  }
`;

export const GET_STUDENT_MARKS = gql`
  query GetStudentMarks($studentId: ID!, $examId: ID) {
    getStudentMarks(studentId: $studentId, examId: $examId) {
      id
      marksObtained
      grade
      remarks
      examId {
        id
        name
        academicYear
      }
      subjectId {
        id
        name
        code
      }
    }
  }
`;

export const GET_STUDENT_FEE_STATUS = gql`
  query GetStudentFeeStatus($studentId: ID!) {
    getStudentFeeStatus(studentId: $studentId) {
      id
      amountPaid
      paymentDate
      paymentMethod
      status
      referenceNo
      receiptNo
      remarks
      feeId {
        id
        title
        category
        amount
        dueDate
        academicYear
      }
    }
  }
`;

export const GET_TRANSPORT_ROUTES = gql`
  query GetTransportRoutes {
    getTransportRoutes {
      id
      routeName
      startLocation
      endLocation
      routeFee
      status
      stops {
        stopName
        arrivalTime
      }
    }
  }
`;

export const GET_VEHICLES = gql`
  query GetVehicles {
    getVehicles {
      id
      vehicleNo
      model
      capacity
      driverName
      driverPhone
      routeId {
        id
        routeName
      }
      status
    }
  }
`;

// --- CRUD OPERATIONS MUTATIONS ---

export const UPDATE_CLASS = gql`
  mutation UpdateClass($id: ID!, $name: String, $code: String, $description: String) {
    updateClass(id: $id, name: $name, code: $code, description: $description) {
      id
      name
      code
      description
    }
  }
`;

export const DELETE_CLASS = gql`
  mutation DeleteClass($id: ID!) {
    deleteClass(id: $id)
  }
`;

export const UPDATE_SECTION = gql`
  mutation UpdateSection($id: ID!, $classId: ID, $name: String, $roomNumber: String, $capacity: Int, $classTeacherId: ID) {
    updateSection(id: $id, classId: $classId, name: $name, roomNumber: $roomNumber, capacity: $capacity, classTeacherId: $classTeacherId) {
      id
      name
      classId {
        id
        name
      }
      classTeacherId {
        id
        firstName
        lastName
      }
    }
  }
`;

export const DELETE_SECTION = gql`
  mutation DeleteSection($id: ID!) {
    deleteSection(id: $id)
  }
`;

export const UPDATE_SUBJECT = gql`
  mutation UpdateSubject($id: ID!, $classId: ID, $name: String, $code: String, $type: String) {
    updateSubject(id: $id, classId: $classId, name: $name, code: $code, type: $type) {
      id
      name
      code
      type
      classId {
        id
        name
      }
    }
  }
`;

export const DELETE_SUBJECT = gql`
  mutation DeleteSubject($id: ID!) {
    deleteSubject(id: $id)
  }
`;

export const UPDATE_TEACHER = gql`
  mutation UpdateTeacher($id: ID!, $email: String, $firstName: String, $lastName: String, $gender: String, $dateOfBirth: Date, $phone: String, $qualification: String, $designation: String) {
    updateTeacher(id: $id, email: $email, firstName: $firstName, lastName: $lastName, gender: $gender, dateOfBirth: $dateOfBirth, phone: $phone, qualification: $qualification, designation: $designation) {
      id
      firstName
      lastName
      email
      phone
      qualification
      designation
    }
  }
`;

export const DELETE_TEACHER = gql`
  mutation DeleteTeacher($id: ID!) {
    deleteTeacher(id: $id)
  }
`;

export const UPDATE_PARENT = gql`
  mutation UpdateParent($id: ID!, $email: String, $firstName: String, $lastName: String, $relation: String, $phone: String, $childrenIds: [ID!]) {
    updateParent(id: $id, email: $email, firstName: $firstName, lastName: $lastName, relation: $relation, phone: $phone, childrenIds: $childrenIds) {
      id
      firstName
      lastName
      relation
      phone
      email
    }
  }
`;

export const DELETE_PARENT = gql`
  mutation DeleteParent($id: ID!) {
    deleteParent(id: $id)
  }
`;

export const UPDATE_FEE_STRUCTURE = gql`
  mutation UpdateFeeStructure($id: ID!, $title: String, $category: String, $amount: Float, $classId: ID, $dueDate: Date, $academicYear: String, $description: String) {
    updateFeeStructure(id: $id, title: $title, category: $category, amount: $amount, classId: $classId, dueDate: $dueDate, academicYear: $academicYear, description: $description) {
      id
      title
      category
      amount
      dueDate
      academicYear
    }
  }
`;

export const DELETE_FEE_STRUCTURE = gql`
  mutation DeleteFeeStructure($id: ID!) {
    deleteFeeStructure(id: $id)
  }
`;

export const UPDATE_HOMEWORK = gql`
  mutation UpdateHomework($id: ID!, $title: String, $description: String, $classId: ID, $sectionId: ID, $subjectId: ID, $teacherId: ID, $dueDate: Date) {
    updateHomework(id: $id, title: $title, description: $description, classId: $classId, sectionId: $sectionId, subjectId: $subjectId, teacherId: $teacherId, dueDate: $dueDate) {
      id
      title
      description
      dueDate
    }
  }
`;

export const DELETE_HOMEWORK = gql`
  mutation DeleteHomework($id: ID!) {
    deleteHomework(id: $id)
  }
`;

export const DELETE_SCHOOL = gql`
  mutation DeleteSchool($id: ID!) {
    deleteSchool(id: $id)
  }
`;

export const GET_TEACHER_ATTENDANCE = gql`
  query GetTeacherAttendance($date: Date!) {
    getTeacherAttendance(date: $date) {
      id
      status
      remarks
      faceImage
      location
      checkIn
      teacherId {
        id
        firstName
        lastName
        phone
      }
    }
  }
`;

export const GET_STAFF_ATTENDANCE = gql`
  query GetStaffAttendance($date: Date!) {
    getStaffAttendance(date: $date) {
      id
      status
      remarks
      faceImage
      location
      checkIn
      staffId {
        id
        firstName
        lastName
        department
        phone
      }
    }
  }
`;

export const MARK_BULK_TEACHER_ATTENDANCE = gql`
  mutation MarkBulkTeacherAttendance($date: Date!, $records: [BulkTeacherAttendanceInput!]!) {
    markBulkTeacherAttendance(date: $date, records: $records)
  }
`;

export const MARK_BULK_STAFF_ATTENDANCE = gql`
  mutation MarkBulkStaffAttendance($date: Date!, $records: [BulkStaffAttendanceInput!]!) {
    markBulkStaffAttendance(date: $date, records: $records)
  }
`;

export const REGISTER_STAFF = gql`
  mutation RegisterStaff(
    $email: String!
    $firstName: String!
    $lastName: String!
    $gender: String!
    $phone: String!
    $department: String!
    $designation: String!
    $password: String
  ) {
    registerStaff(
      email: $email
      firstName: $firstName
      lastName: $lastName
      gender: $gender
      phone: $phone
      department: $department
      designation: $designation
      password: $password
    ) {
      id
      firstName
      lastName
      email
      department
      designation
    }
  }
`;

export const UPDATE_STAFF = gql`
  mutation UpdateStaff(
    $id: ID!
    $email: String
    $firstName: String
    $lastName: String
    $gender: String
    $phone: String
    $department: String
    $designation: String
  ) {
    updateStaff(
      id: $id
      email: $email
      firstName: $firstName
      lastName: $lastName
      gender: $gender
      phone: $phone
      department: $department
      designation: $designation
    ) {
      id
      firstName
      lastName
      email
      phone
      department
      designation
    }
  }
`;

export const DELETE_STAFF = gql`
  mutation DeleteStaff($id: ID!) {
    deleteStaff(id: $id)
  }
`;

export const GET_EXAMS = gql`
  query GetExams {
    getExams {
      id
      name
      academicYear
      startDate
      endDate
    }
  }
`;

export const ENTER_STUDENT_MARKS = gql`
  mutation EnterStudentMarks($studentId: ID!, $examId: ID!, $subjectId: ID!, $marksObtained: Float!, $grade: String, $remarks: String) {
    enterStudentMarks(studentId: $studentId, examId: $examId, subjectId: $subjectId, marksObtained: $marksObtained, grade: $grade, remarks: $remarks) {
      id
      marksObtained
      grade
      remarks
    }
  }
`;

export const GET_TIMETABLES = gql`
  query GetTimetables($classId: ID, $sectionId: ID, $teacherId: ID) {
    getTimetables(classId: $classId, sectionId: $sectionId, teacherId: $teacherId) {
      id
      dayOfWeek
      startTime
      endTime
      classId {
        id
        name
        code
      }
      sectionId {
        id
        name
        roomNumber
      }
      subjectId {
        id
        name
        code
      }
      teacherId {
        id
        firstName
        lastName
      }
      roomNumber
    }
  }
`;

export const CREATE_TIMETABLE_ENTRY = gql`
  mutation CreateTimetableEntry(
    $dayOfWeek: String!
    $startTime: String!
    $endTime: String!
    $classId: ID!
    $sectionId: ID!
    $subjectId: ID!
    $teacherId: ID!
    $roomNumber: String
  ) {
    createTimetableEntry(
      dayOfWeek: $dayOfWeek
      startTime: $startTime
      endTime: $endTime
      classId: $classId
      sectionId: $sectionId
      subjectId: $subjectId
      teacherId: $teacherId
      roomNumber: $roomNumber
    ) {
      id
      dayOfWeek
      startTime
      endTime
      classId {
        id
        name
      }
      sectionId {
        id
        name
      }
      subjectId {
        id
        name
      }
      teacherId {
        id
        firstName
        lastName
      }
      roomNumber
    }
  }
`;

export const UPDATE_TIMETABLE_ENTRY = gql`
  mutation UpdateTimetableEntry(
    $id: ID!
    $dayOfWeek: String
    $startTime: String
    $endTime: String
    $classId: ID
    $sectionId: ID
    $subjectId: ID
    $teacherId: ID
    $roomNumber: String
  ) {
    updateTimetableEntry(
      id: $id
      dayOfWeek: $dayOfWeek
      startTime: $startTime
      endTime: $endTime
      classId: $classId
      sectionId: $sectionId
      subjectId: $subjectId
      teacherId: $teacherId
      roomNumber: $roomNumber
    ) {
      id
      dayOfWeek
      startTime
      endTime
      classId {
        id
        name
      }
      sectionId {
        id
        name
      }
      subjectId {
        id
        name
      }
      teacherId {
        id
        firstName
        lastName
      }
      roomNumber
    }
  }
`;

export const DELETE_TIMETABLE_ENTRY = gql`
  mutation DeleteTimetableEntry($id: ID!) {
    deleteTimetableEntry(id: $id)
  }
`;

export const GET_GRADES = gql`
  query GetGrades {
    getGrades {
      id
      gradeName
      minPercentage
      maxPercentage
      gradePoint
      remarks
    }
  }
`;

export const GET_CLASS_PERFORMANCE_ANALYTICS = gql`
  query GetClassPerformanceAnalytics($classId: ID!, $examId: ID!, $sectionId: ID) {
    getClassPerformanceAnalytics(classId: $classId, examId: $examId, sectionId: $sectionId) {
      classAverage
      totalStudents
      strugglingCount
      highestScore
      gradeDistribution {
        grade
        count
      }
      studentAnalytics {
        studentId
        rollNo
        name
        totalObtained
        totalMax
        percentage
        grade
        isStruggling
        subjectsCount
        homeworkAverage
        homeworkCompletionRate
        marks {
          subjectId
          subjectName
          marksObtained
          maxMarks
          passMarks
          grade
          pass
        }
      }
      subjectAnalytics {
        subjectId
        subjectName
        averagePercentage
        highestScore
        passCount
        failCount
      }
    }
  }
`;

export const CREATE_EXAM = gql`
  mutation CreateExam($name: String!, $academicYear: String!, $startDate: Date, $endDate: Date, $description: String) {
    createExam(name: $name, academicYear: $academicYear, startDate: $startDate, endDate: $endDate, description: $description) {
      id
      name
      academicYear
      startDate
      endDate
    }
  }
`;

export const DELETE_EXAM = gql`
  mutation DeleteExam($id: ID!) {
    deleteExam(id: $id)
  }
`;

export const GET_EXAM_SCHEDULES = gql`
  query GetExamSchedules($examId: ID, $classId: ID, $sectionId: ID) {
    getExamSchedules(examId: $examId, classId: $classId, sectionId: $sectionId) {
      id
      examId {
        id
        name
      }
      subjectId {
        id
        name
        code
      }
      classId {
        id
        name
      }
      sectionId {
        id
        name
      }
      date
      startTime
      endTime
      maxMarks
      passMarks
      roomNo
    }
  }
`;

export const CREATE_EXAM_SCHEDULE = gql`
  mutation CreateExamSchedule(
    $examId: ID!
    $subjectId: ID!
    $classId: ID!
    $date: Date!
    $startTime: String!
    $endTime: String!
    $maxMarks: Float!
    $passMarks: Float!
    $roomNo: String
    $sectionId: ID
  ) {
    createExamSchedule(
      examId: $examId
      subjectId: $subjectId
      classId: $classId
      date: $date
      startTime: $startTime
      endTime: $endTime
      maxMarks: $maxMarks
      passMarks: $passMarks
      roomNo: $roomNo
      sectionId: $sectionId
    ) {
      id
      date
      startTime
      endTime
      maxMarks
      passMarks
      roomNo
      sectionId {
        id
        name
      }
    }
  }
`;

export const DELETE_EXAM_SCHEDULE = gql`
  mutation DeleteExamSchedule($id: ID!) {
    deleteExamSchedule(id: $id)
  }
`;

export const GET_LEAVE_REQUESTS = gql`
  query GetLeaveRequests {
    getLeaveRequests {
      id
      leaveType
      startDate
      endDate
      reason
      status
      approvalRemarks
      approvedAt
      userId {
        id
        name
        role
        email
      }
      approvedBy {
        id
        name
      }
    }
  }
`;

export const REQUEST_LEAVE = gql`
  mutation RequestLeave($leaveType: String!, $startDate: Date!, $endDate: Date!, $reason: String!) {
    requestLeave(leaveType: $leaveType, startDate: $startDate, endDate: $endDate, reason: $reason) {
      id
      leaveType
      startDate
      endDate
      reason
      status
    }
  }
`;

export const UPDATE_LEAVE_STATUS = gql`
  mutation UpdateLeaveStatus($leaveId: ID!, $status: String!, $remarks: String) {
    updateLeaveStatus(leaveId: $leaveId, status: $status, remarks: $remarks) {
      id
      status
      approvalRemarks
      approvedAt
      approvedBy {
        id
        name
      }
    }
  }
`;

export const GET_TEACHER_LEAVE_BALANCE = gql`
  query GetTeacherLeaveBalance($userId: ID!) {
    getTeacherLeaveBalance(userId: $userId) {
      leaveType
      allowed
      used
      remaining
    }
  }
`;

export const GET_PAYROLL_LIST = gql`
  query GetPayrollList {
    getPayrollList {
      id
      basicSalary
      netSalary
      month
      year
      status
      payslipNo
      paymentDate
      paymentMethod
      allowances {
        name
        amount
      }
      deductions {
        name
        amount
      }
      userId {
        id
        name
        email
        role
      }
    }
  }
`;

export const GENERATE_PAYSLIP = gql`
  mutation GeneratePayslip(
    $userId: ID!
    $basicSalary: Float!
    $month: Int!
    $year: Int!
    $allowances: [PayrollItemInput!]
    $deductions: [PayrollItemInput!]
    $paymentMethod: String
  ) {
    generatePayslip(
      userId: $userId
      basicSalary: $basicSalary
      month: $month
      year: $year
      allowances: $allowances
      deductions: $deductions
      paymentMethod: $paymentMethod
    ) {
      id
      payslipNo
      netSalary
      month
      year
    }
  }
`;

export const GET_TEACHER_ATTENDANCE_STATS = gql`
  query GetTeacherAttendanceStats($teacherId: ID!, $month: Int!, $year: Int!) {
    getTeacherAttendanceStats(teacherId: $teacherId, month: $month, year: $year) {
      presentCount
      absentCount
      halfDayCount
      leaveCount
      totalCount
    }
  }
`;

export const GET_LEAVE_LIMIT = gql`
  query GetLeaveLimit {
    getLeaveLimit {
      id
      casual
      medical
      maternity
      paternity
      sabbatical
    }
  }
`;

export const UPDATE_LEAVE_LIMIT = gql`
  mutation UpdateLeaveLimit($casual: Int!, $medical: Int!, $maternity: Int!, $paternity: Int!, $sabbatical: Int!) {
    updateLeaveLimit(casual: $casual, medical: $medical, maternity: $maternity, paternity: $paternity, sabbatical: $sabbatical) {
      id
      casual
      medical
      maternity
      paternity
      sabbatical
    }
  }
`;

export const GET_STUDENT_FEE_STRUCTURE = gql`
  query GetStudentFeeStructure($studentId: ID!, $academicYear: String!) {
    getStudentFeeStructure(studentId: $studentId, academicYear: $academicYear) {
      id
      academicYear
      status
      components {
        id
        name
        category
        amount
        dueDate
        description
      }
    }
  }
`;

export const SAVE_STUDENT_FEE_STRUCTURE = gql`
  mutation SaveStudentFeeStructure($studentId: ID!, $academicYear: String!, $components: [FeeComponentInput!]!) {
    saveStudentFeeStructure(studentId: $studentId, academicYear: $academicYear, components: $components) {
      id
      academicYear
      status
      components {
        id
        name
        category
        amount
        dueDate
        description
      }
    }
  }
`;

export const GET_PENDING_JOBS = gql`
  query GetPendingJobs {
    getPendingJobs {
      id
      jobType
      subjectName
      chapterId {
        id
        name
      }
      topicName
      status
      remarks
      createdAt
      teacherId {
        id
        firstName
        lastName
        userId {
          id
          avatar
        }
      }
    }
  }
`;

export const CREATE_PENDING_JOB = gql`
  mutation CreatePendingJob(
    $jobType: String!
    $subjectName: String
    $chapterId: ID
    $topicName: String
    $status: String
    $remarks: String
  ) {
    createPendingJob(
      jobType: $jobType
      subjectName: $subjectName
      chapterId: $chapterId
      topicName: $topicName
      status: $status
      remarks: $remarks
    ) {
      id
      jobType
      subjectName
      chapterId {
        id
        name
      }
      topicName
      status
      remarks
      createdAt
      teacherId {
        id
        firstName
        lastName
      }
    }
  }
`;

export const UPDATE_PENDING_JOB_STATUS = gql`
  mutation UpdatePendingJobStatus($id: ID!, $status: String!) {
    updatePendingJobStatus(id: $id, status: $status) {
      id
      status
    }
  }
`;

export const GET_CHAPTERS = gql`
  query GetChapters($subjectId: ID) {
    getChapters(subjectId: $subjectId) {
      id
      name
      subjectId {
        id
        name
      }
      classId {
        id
        name
      }
    }
  }
`;

export const CREATE_CHAPTER = gql`
  mutation CreateChapter($name: String!, $subjectId: ID!, $classId: ID!) {
    createChapter(name: $name, subjectId: $subjectId, classId: $classId) {
      id
      name
      subjectId {
        id
        name
      }
      classId {
        id
        name
      }
    }
  }
`;

export const DELETE_CHAPTER = gql`
  mutation DeleteChapter($id: ID!) {
    deleteChapter(id: $id)
  }
`;

export const GET_VEHICLES_TRACKING = gql`
  query GetVehiclesTracking {
    getVehicles {
      id
      vehicleNo
      model
      capacity
      driverName
      driverPhone
      status
      currentLatitude
      currentLongitude
      lastUpdated
      routeId {
        id
        routeName
        startLocation
        endLocation
        routeFee
        status
        stops {
          stopName
          arrivalTime
        }
      }
    }
  }
`;

export const UPDATE_VEHICLE_LOCATION = gql`
  mutation UpdateVehicleLocation($id: ID!, $latitude: Float!, $longitude: Float!, $status: String!) {
    updateVehicleLocation(id: $id, latitude: $latitude, longitude: $longitude, status: $status) {
      id
      vehicleNo
      status
      currentLatitude
      currentLongitude
      lastUpdated
    }
  }
`;

export const CREATE_TRANSPORT_ROUTE = gql`
  mutation CreateTransportRoute($routeName: String!, $startLocation: String!, $endLocation: String!, $stops: [StopInput!], $routeFee: Float!) {
    createTransportRoute(routeName: $routeName, startLocation: $startLocation, endLocation: $endLocation, stops: $stops, routeFee: $routeFee) {
      id
      routeName
    }
  }
`;

export const CREATE_VEHICLE = gql`
  mutation CreateVehicle($vehicleNo: String!, $model: String, $capacity: Int!, $driverName: String!, $driverPhone: String!, $routeId: ID) {
    createVehicle(vehicleNo: $vehicleNo, model: $model, capacity: $capacity, driverName: $driverName, driverPhone: $driverPhone, routeId: $routeId) {
      id
      vehicleNo
    }
  }
`;

export const GET_COPY_SUBMISSIONS = gql`
  query GetCopySubmissions($classId: ID!, $sectionId: ID!, $subjectId: ID!) {
    getCopySubmissions(classId: $classId, sectionId: $sectionId, subjectId: $subjectId) {
      id
      studentId {
        id
        firstName
        lastName
        rollNo
      }
      subjectId {
        id
        name
      }
      classId {
        id
        name
      }
      sectionId {
        id
        name
      }
      isCompleted
      remarks
    }
  }
`;

export const SAVE_COPY_SUBMISSIONS = gql`
  mutation SaveCopySubmissions($classId: ID!, $sectionId: ID!, $subjectId: ID!, $submissions: [CopySubmissionInput!]!) {
    saveCopySubmissions(classId: $classId, sectionId: $sectionId, subjectId: $subjectId, submissions: $submissions)
  }
`;

export const GET_HOMEWORK_SUBMISSIONS = gql`
  query GetHomeworkSubmissions($homeworkId: ID!) {
    getHomeworkSubmissions(homeworkId: $homeworkId) {
      id
      homeworkId {
        id
        title
      }
      studentId {
        id
        firstName
        lastName
        rollNo
      }
      submissionText
      attachments {
        name
        url
      }
      submissionDate
      status
      gradePoints
      feedback
    }
  }
`;

export const SUBMIT_HOMEWORK = gql`
  mutation SubmitHomework($homeworkId: ID!, $studentId: ID!, $submissionText: String, $attachments: [DocumentInput]) {
    submitHomework(homeworkId: $homeworkId, studentId: $studentId, submissionText: $submissionText, attachments: $attachments) {
      id
      status
      submissionText
      submissionDate
      studentId {
        id
        firstName
        lastName
      }
    }
  }
`;

export const GRADE_HOMEWORK = gql`
  mutation GradeHomework($submissionId: ID!, $gradePoints: Float!, $feedback: String!) {
    gradeHomework(submissionId: $submissionId, gradePoints: $gradePoints, feedback: $feedback) {
      id
      status
      gradePoints
      feedback
      studentId {
        id
        firstName
        lastName
      }
    }
  }
`;

export const GET_EVENTS = gql`
  query GetEvents {
    getEvents {
      id
      title
      type
      date
      description
      status
    }
  }
`;

export const CREATE_EVENT = gql`
  mutation CreateEvent($title: String!, $type: String!, $date: Date!, $description: String) {
    createEvent(title: $title, type: $type, date: $date, description: $description) {
      id
      title
      type
      date
      description
      status
    }
  }
`;

export const DELETE_EVENT = gql`
  mutation DeleteEvent($id: ID!) {
    deleteEvent(id: $id)
  }
`;

export const GET_MY_ATTENDANCE_TODAY = gql`
  query GetMyAttendanceToday {
    getMyAttendanceToday {
      marked
      status
      checkIn
      faceImage
      location
    }
  }
`;

export const MARK_SELF_ATTENDANCE = gql`
  mutation MarkSelfAttendance($faceImage: String!, $location: String) {
    markSelfAttendance(faceImage: $faceImage, location: $location)
  }
`;

export const GET_GRADE_DISTRIBUTION = gql`
  query GetGradeDistribution($classId: ID, $sectionId: ID) {
    getGradeDistribution(classId: $classId, sectionId: $sectionId) {
      grade
      count
    }
  }
`;

export const GET_COPY_SUBMISSION_ANALYTICS = gql`
  query GetCopySubmissionAnalytics($classId: ID, $sectionId: ID) {
    getCopySubmissionAnalytics(classId: $classId, sectionId: $sectionId) {
      className
      subjectName
      completedCount
      totalCount
      completionRate
    }
  }
`;

export const GET_TEACHER_ATTENDANCE_SUMMARY = gql`
  query GetTeacherAttendanceSummary($month: Int!, $year: Int!) {
    getTeacherAttendanceSummary(month: $month, year: $year) {
      teacherId
      name
      email
      phone
      absentCount
      leaveCount
    }
  }
`;



