// Complete RWJF Grant Structure for Howard University College of Medicine
// Based on RWJF Funding_HUCM_Final[19].docx and Budget Justification documents

export const createRWJFGrant = () => {
  return {
    title: 'RWJF Howard University College of Medicine - Diversity and Inclusion in Health Professions',
    fundingAgency: 'Robert Wood Johnson Foundation',
    amount: 1066360, // Total from budget justification (estimated)
    status: 'active',
    startDate: '', // User will fill in
    endDate: '', // User will fill in
    grantNumber: 'GR-00937',
    principalInvestigator: 'Dr. Marjorie C. Gondré-Lewis, Associate Dean for Faculty Development & JEDI',
    institution: 'Howard University College of Medicine',
    aims: [
      {
        id: crypto.randomUUID(),
        number: 'Aim 1',
        title: 'Aim 1 - Institutionalizing DEI Through Structural Reform',
        description: 'Ensure that JEDI efforts are enshrined in all operations of the College of Medicine with formal documentation via a robust dashboard to track activity and facilitate accountability. Conduct HUCM-wide self-study and institute DEI sensitivity training for all constituents.',
        targetDate: '',
        status: 'in-progress',
        budgetAllocation: 159000, // DEI Dashboard $75K + Mentorship $60K + Microgrants $24K
        budgetSpent: 0,
        completionPercentage: 0,
        subAims: [
          {
            id: crypto.randomUUID(),
            number: '1a',
            title: 'Belonging in Medicine Initiative',
            description: 'Embed DEI into policies and daily practices through: (a) Cultural Humility Training to recognize and mitigate implicit biases, (b) Trauma-informed teaching practices with flexible deadlines for students with health/socioeconomic problems, (c) Equity-centered care training for addressing structural barriers like food insecurity and pain threshold misconceptions.',
            status: 'in-progress',
            completionPercentage: 0,
            assignedTo: 'DEI Committee',
            targetDate: '',
            budgetAllocation: 50000, // Portion of DEI dashboard and training materials
            activities: [
              {
                id: crypto.randomUUID(),
                title: 'Design Cultural Humility Training Curriculum',
                description: 'Develop comprehensive training curriculum covering implicit bias recognition, cultural competence, and equitable care practices. Include case studies, interactive exercises, and assessment tools.',
                deliverables: [
                  'Training curriculum manual (100+ pages)',
                  'Participant workbook',
                  'Facilitator guide',
                  'Pre/post assessment forms'
                ],
                owner: 'DEI Committee + External Consultant',
                dueDate: '',
                status: 'not-started',
                budgetAmount: 15000,
                estimatedHours: 120,
                dependencies: [],
                notes: 'Consider hiring external DEI consultant for curriculum design'
              },
              {
                id: crypto.randomUUID(),
                title: 'Schedule Training Sessions for All Constituents',
                description: 'Coordinate and schedule mandatory Cultural Humility Training for 100% of faculty, staff, and students. Organize into cohorts to accommodate schedules.',
                deliverables: [
                  'Training schedule for 2 years',
                  'Registration system',
                  'Attendance tracking database',
                  'Completion certificates'
                ],
                owner: 'Program Director',
                dueDate: '',
                status: 'not-started',
                budgetAmount: 5000,
                estimatedHours: 40,
                dependencies: ['Design Cultural Humility Training Curriculum'],
                notes: 'Target: 100% participation rate within Year 1'
              },
              {
                id: crypto.randomUUID(),
                title: 'Conduct Training Sessions',
                description: 'Deliver Cultural Humility Training workshops to all HUCM constituents. Sessions include lectures, group discussions, role-playing, and reflection exercises.',
                deliverables: [
                  'Training attendance logs',
                  'Participant feedback surveys',
                  'Pre/post assessment results',
                  'Completion certificates issued'
                ],
                owner: 'Training Coordinator + Facilitators',
                dueDate: '',
                status: 'not-started',
                budgetAmount: 20000,
                estimatedHours: 200,
                dependencies: ['Schedule Training Sessions for All Constituents'],
                notes: 'Plan for 15-20 cohorts over Year 1-2'
              },
              {
                id: crypto.randomUUID(),
                title: 'Develop Trauma-Informed Teaching Policy',
                description: 'Create comprehensive policy document for trauma-informed teaching practices, including guidelines for trigger warnings, flexible deadlines for students facing hardship, and compassionate pedagogical approaches.',
                deliverables: [
                  'Trauma-Informed Teaching Policy Document',
                  'Faculty implementation guidelines',
                  'Student notification materials',
                  'Policy approved by Dean'
                ],
                owner: 'Curriculum Committee',
                dueDate: '',
                status: 'not-started',
                budgetAmount: 3000,
                estimatedHours: 60,
                dependencies: [],
                notes: 'Require Dean approval before implementation'
              },
              {
                id: crypto.randomUUID(),
                title: 'Implement Flexible Deadline System',
                description: 'Operationalize flexible deadline policy in course syllabi and student handbook. Train faculty on assessment accommodations for students with health/socioeconomic challenges.',
                deliverables: [
                  'Updated student handbook',
                  'Faculty training module',
                  'Request form for students',
                  'Tracking system for accommodations'
                ],
                owner: 'Student Affairs + Faculty Development',
                dueDate: '',
                status: 'not-started',
                budgetAmount: 2000,
                estimatedHours: 30,
                dependencies: ['Develop Trauma-Informed Teaching Policy'],
                notes: 'Coordinate with Registrar for system implementation'
              },
              {
                id: crypto.randomUUID(),
                title: 'Create Equity-Centered Care Training Modules',
                description: 'Develop 4 teaching modules addressing structural barriers: (1) Food insecurity and diabetes management, (2) Pain threshold misconceptions, (3) Race-based clinical algorithms critique, (4) Social determinants documentation.',
                deliverables: [
                  'Module 1: Food Insecurity & Chronic Disease',
                  'Module 2: Dismantling Pain Bias',
                  'Module 3: Race-Based Algorithms (eGFR)',
                  'Module 4: SDOH Documentation in EMR'
                ],
                owner: 'Clinical Faculty Working Group',
                dueDate: '',
                status: 'not-started',
                budgetAmount: 8000,
                estimatedHours: 100,
                dependencies: [],
                notes: 'Integrate into clinical skills curriculum'
              },
              {
                id: crypto.randomUUID(),
                title: 'Pilot Test New Materials',
                description: 'Pilot equity-centered care modules with select clinical faculty and medical students. Gather feedback, assess effectiveness, and refine content before full rollout.',
                deliverables: [
                  'Pilot implementation plan',
                  'Student feedback surveys',
                  'Faculty evaluation forms',
                  'Revision recommendations report'
                ],
                owner: 'Assessment Team',
                dueDate: '',
                status: 'not-started',
                budgetAmount: 2000,
                estimatedHours: 40,
                dependencies: ['Create Equity-Centered Care Training Modules'],
                notes: 'Select 2-3 courses for pilot in Year 1'
              },
              {
                id: crypto.randomUUID(),
                title: 'Full Curriculum Implementation',
                description: 'Integrate all equity-centered care modules and trauma-informed practices across entire medical curriculum. Train all faculty, update course materials, and establish ongoing assessment.',
                deliverables: [
                  'All courses updated with equity lens',
                  'Faculty completion certificates',
                  'Student learning outcome data',
                  'Annual assessment plan'
                ],
                owner: 'Curriculum Committee',
                dueDate: '',
                status: 'not-started',
                budgetAmount: 5000,
                estimatedHours: 80,
                dependencies: ['Pilot Test New Materials', 'Conduct Training Sessions'],
                notes: 'Full implementation by end of Year 2'
              }
            ]
          },
          {
            id: crypto.randomUUID(),
            number: '1b',
            title: 'Peer Mentorship Networks to Combat Attrition',
            description: '3-tiered mentorship model: (a) Faculty paired with medical students for monthly sessions, (b) Peer circles connecting faculty across departments, (c) Mentorship Impact Dashboard tracking retention rates and funding success. Mentorship participation counted toward promotion.',
            status: 'in-progress',
            completionPercentage: 0,
            assignedTo: 'Faculty Development Office',
            targetDate: '',
            budgetAllocation: 60000, // Mentorship network development $30K/yr × 2
            activities: [
              {
                id: crypto.randomUUID(),
                title: 'Design 3-Tiered Mentorship Model',
                description: 'Create comprehensive mentorship framework including: (1) Faculty-student pairs, (2) Peer faculty circles, (3) Impact measurement dashboard',
                deliverables: [
                  'Mentorship program design document',
                  'Matching algorithm/criteria',
                  'Mentorship agreement templates',
                  'Training materials for mentors'
                ],
                owner: 'Faculty Development Office',
                dueDate: '',
                status: 'not-started',
                budgetAmount: 8000,
                estimatedHours: 80,
                dependencies: [],
                notes: 'Align with P&T promotion criteria'
              },
              {
                id: crypto.randomUUID(),
                title: 'Recruit and Train Faculty Mentors',
                description: 'Identify interested faculty mentors and provide training on effective mentorship, cultural humility, and retention strategies',
                deliverables: [
                  'Faculty mentor roster (50+ mentors)',
                  'Mentor training completion certificates',
                  'Mentor handbook',
                  'Monthly meeting schedule'
                ],
                owner: 'Associate Dean',
                dueDate: '',
                status: 'not-started',
                budgetAmount: 10000,
                estimatedHours: 60,
                dependencies: ['Design 3-Tiered Mentorship Model'],
                notes: 'Incentivize participation through P&T recognition'
              },
              {
                id: crypto.randomUUID(),
                title: 'Match Students with Faculty Mentors',
                description: 'Pair medical students with faculty mentors based on interests, career goals, and compatibility',
                deliverables: [
                  'Student preference surveys',
                  'Mentor-mentee pairings list',
                  'Mentorship agreements signed',
                  'Kickoff event'
                ],
                owner: 'Program Coordinator',
                dueDate: '',
                status: 'not-started',
                budgetAmount: 5000,
                estimatedHours: 40,
                dependencies: ['Recruit and Train Faculty Mentors'],
                notes: 'Target 100% of medical students matched'
              },
              {
                id: crypto.randomUUID(),
                title: 'Launch Peer Faculty Circles',
                description: 'Establish cross-departmental peer support groups for faculty to share experiences, resources, and strategies',
                deliverables: [
                  'Faculty circle groups (8-10 circles)',
                  'Meeting schedules',
                  'Discussion guides',
                  'Participation tracking'
                ],
                owner: 'Faculty Development Office',
                dueDate: '',
                status: 'not-started',
                budgetAmount: 7000,
                estimatedHours: 50,
                dependencies: ['Recruit and Train Faculty Mentors'],
                notes: 'Monthly meetings with rotating facilitators'
              },
              {
                id: crypto.randomUUID(),
                title: 'Build Mentorship Impact Dashboard',
                description: 'Develop dashboard to track mentorship participation, retention rates, funding success, and satisfaction metrics',
                deliverables: [
                  'Interactive dashboard (web-based)',
                  'Real-time data integration',
                  'Monthly reporting templates',
                  'User training materials'
                ],
                owner: 'IT + Assessment Team',
                dueDate: '',
                status: 'not-started',
                budgetAmount: 20000,
                estimatedHours: 120,
                dependencies: ['Design 3-Tiered Mentorship Model'],
                notes: 'Track: retention, graduation, USMLE, residency match, faculty grants'
              },
              {
                id: crypto.randomUUID(),
                title: 'Update P&T Criteria to Include Mentorship',
                description: 'Revise promotion and tenure policies to formally recognize mentorship contributions as service/teaching',
                deliverables: [
                  'Updated P&T policy document',
                  'Faculty handbook revision',
                  'P&T committee approval',
                  'Faculty notification'
                ],
                owner: 'P&T Committee + Dean',
                dueDate: '',
                status: 'not-started',
                budgetAmount: 2000,
                estimatedHours: 30,
                dependencies: [],
                notes: 'Requires formal policy vote'
              },
              {
                id: crypto.randomUUID(),
                title: 'Monitor and Evaluate Mentorship Outcomes',
                description: 'Conduct ongoing evaluation of mentorship program effectiveness through surveys, retention data, and feedback',
                deliverables: [
                  'Quarterly evaluation reports',
                  'Student satisfaction surveys',
                  'Mentor feedback surveys',
                  'Retention rate analysis'
                ],
                owner: 'Assessment Team',
                dueDate: '',
                status: 'not-started',
                budgetAmount: 8000,
                estimatedHours: 60,
                dependencies: ['Build Mentorship Impact Dashboard'],
                notes: 'Compare retention rates pre/post program'
              }
            ]
          },
          {
            id: crypto.randomUUID(),
            number: '1c',
            title: 'Curriculum Innovation: Anti-Racism in Action',
            description: 'Integrate JEDI principles into medical curriculum: debunk race as biological construct, address race-based clinical algorithms, incorporate social determinants of health (SDOH) documentation. Microgrants of $2,000 to incentivize faculty to redesign/modernize courses.',
            status: 'in-progress',
            completionPercentage: 0,
            assignedTo: 'JEDI Task Force',
            targetDate: '',
            budgetAllocation: 24000, // Curriculum microgrants: $3K × 4 faculty/yr × 2 years
            activities: [
              {
                id: crypto.randomUUID(),
                title: 'Develop Anti-Racism Curriculum Module: Race as Social Construct',
                description: 'Create teaching module debunking race as biological construct, addressing historical origins of racial categories in medicine',
                deliverables: [
                  'Lecture slides and materials',
                  'Case studies',
                  'Reading list',
                  'Assessment questions'
                ],
                owner: 'JEDI Task Force',
                dueDate: '',
                status: 'not-started',
                budgetAmount: 3000,
                estimatedHours: 40,
                dependencies: [],
                notes: 'Integrate into Year 1 curriculum'
              },
              {
                id: crypto.randomUUID(),
                title: 'Create Module: Dismantling Race-Based Clinical Algorithms',
                description: 'Develop teaching content addressing eGFR, spirometry, VBAC calculator adjustments and removal of race corrections',
                deliverables: [
                  'Clinical algorithm critique slides',
                  'Evidence review document',
                  'Alternative calculation methods',
                  'Clinical case studies'
                ],
                owner: 'Clinical Faculty',
                dueDate: '',
                status: 'not-started',
                budgetAmount: 3000,
                estimatedHours: 50,
                dependencies: [],
                notes: 'Focus on eGFR, pulmonary function, obstetric calculators'
              },
              {
                id: crypto.randomUUID(),
                title: 'Integrate SDOH Documentation Training',
                description: 'Train students on documenting social determinants of health (food security, housing, transportation) in EMR systems',
                deliverables: [
                  'SDOH screening tools',
                  'EMR documentation templates',
                  'Training video/workshop',
                  'Competency checklist'
                ],
                owner: 'Clinical Skills Faculty',
                dueDate: '',
                status: 'not-started',
                budgetAmount: 4000,
                estimatedHours: 60,
                dependencies: [],
                notes: 'Partner with EMR team for Z-code implementation'
              },
              {
                id: crypto.randomUUID(),
                title: 'Launch Curriculum Innovation Microgrant Program',
                description: 'Announce and administer microgrant program ($3,000 each) for faculty to redesign courses with JEDI principles',
                deliverables: [
                  'Grant application form',
                  'Selection rubric',
                  'Award announcements (4 faculty Year 1)',
                  'Funding disbursement'
                ],
                owner: 'Program Director',
                dueDate: '',
                status: 'not-started',
                budgetAmount: 12000,
                estimatedHours: 30,
                dependencies: [],
                notes: 'Year 1: 4 grants @ $3K each'
              },
              {
                id: crypto.randomUUID(),
                title: 'Support Grantee Course Redesign',
                description: 'Provide instructional design support and resources to microgrant recipients for course modernization',
                deliverables: [
                  'Redesigned course syllabi (4 courses)',
                  'Updated learning objectives',
                  'New teaching materials',
                  'Assessment plans'
                ],
                owner: 'Grantee Faculty + Curriculum Team',
                dueDate: '',
                status: 'not-started',
                budgetAmount: 2000,
                estimatedHours: 80,
                dependencies: ['Launch Curriculum Innovation Microgrant Program'],
                notes: 'Instructional design consultations available'
              }
            ]
          }
        ],
        kpis: [
          {
            id: crypto.randomUUID(),
            name: 'DEI Self-Assessment & Action Plan Completion',
            description: 'Completion of comprehensive DEI climate self-study and formal improvement plan',
            targetValue: '1',
            currentValue: '0',
            unit: 'completed',
            measurementFrequency: 'one-time',
            percentComplete: 0,
            status: 'pending',
            lastMeasured: '',
            nextMeasurement: '',
            measurements: []
          },
          {
            id: crypto.randomUUID(),
            name: 'DEI Training Participation Rate',
            description: 'Percentage of faculty, staff, and students completing mandatory DEI trainings',
            targetValue: '100',
            currentValue: '0',
            unit: 'percentage',
            measurementFrequency: 'annually',
            percentComplete: 0,
            status: 'on-track',
            lastMeasured: '',
            nextMeasurement: '',
            measurements: []
          },
          {
            id: crypto.randomUUID(),
            name: 'Diversity of Leadership & Committees',
            description: 'Proportion of leadership positions held by individuals from URM groups',
            targetValue: 'Meet/exceed AAMC benchmarks',
            currentValue: '0',
            unit: 'percentage',
            measurementFrequency: 'annually',
            percentComplete: 0,
            status: 'on-track',
            lastMeasured: '',
            nextMeasurement: '',
            measurements: []
          },
          {
            id: crypto.randomUUID(),
            name: 'DEI Dashboard Implementation',
            description: 'Establishment and regular tracking of diversity metrics across the College',
            targetValue: '1',
            currentValue: '0',
            unit: 'operational',
            measurementFrequency: 'quarterly',
            percentComplete: 0,
            status: 'in-progress',
            lastMeasured: '',
            nextMeasurement: '',
            measurements: []
          },
          {
            id: crypto.randomUUID(),
            name: 'Climate of Inclusion Index',
            description: 'Score from climate survey about belonging, respect, and equity',
            targetValue: 'X% increase',
            currentValue: '0',
            unit: 'index score',
            measurementFrequency: 'bi-annually',
            percentComplete: 0,
            status: 'on-track',
            lastMeasured: '',
            nextMeasurement: '',
            measurements: []
          }
        ],
        milestones: [
          {
            id: crypto.randomUUID(),
            title: 'Launch HUCM JEDI Task Force',
            description: 'Convene college-wide JEDI Task Force with faculty and students',
            targetDate: '',
            completedDate: null,
            completed: false,
            status: 'pending',
            dependencies: []
          },
          {
            id: crypto.randomUUID(),
            title: 'Complete DEI Self-Study',
            description: 'Conduct comprehensive HUCM-wide DEI climate self-study',
            targetDate: '',
            completedDate: null,
            completed: false,
            status: 'pending',
            dependencies: []
          },
          {
            id: crypto.randomUUID(),
            title: 'Launch DEI Dashboard',
            description: 'Implement robust dashboard for tracking DEI metrics',
            targetDate: '',
            completedDate: null,
            completed: false,
            status: 'pending',
            dependencies: []
          },
          {
            id: crypto.randomUUID(),
            title: 'Implement DEI Policy Reforms',
            description: 'Update institutional policies based on self-study findings',
            targetDate: '',
            completedDate: null,
            completed: false,
            status: 'pending',
            dependencies: []
          }
        ]
      },
      {
        id: crypto.randomUUID(),
        number: 'Aim 2',
        title: 'Aim 2 - Building a Diverse Pipeline Through Youth Engagement',
        description: 'Expand Mini-Med School program and develop K-12 outreach to inspire underserved youth to pursue medicine',
        targetDate: '',
        status: 'in-progress',
        budgetAllocation: 53318,
        budgetSpent: 0,
        completionPercentage: 0,
        subAims: [
          {
            id: crypto.randomUUID(),
            number: '2a',
            title: 'Mini-Med School Expansion',
            description: 'Scale successful Mini-Med School program to reach more K-12 students from underserved DC communities',
            status: 'in-progress',
            completionPercentage: 0,
            assignedTo: 'Outreach Coordinator',
            targetDate: '',
            budgetAllocation: 30000,
            activities: [
              {
                id: crypto.randomUUID(),
                title: 'Purchase Anatomical Models and Teaching Materials',
                description: 'Acquire hands-on learning materials including anatomical models, microscopes, lab supplies for K-12 demonstrations',
                deliverables: [
                  'Anatomical model inventory',
                  'Lab equipment checklist',
                  'Storage and maintenance plan',
                  'Equipment user manual'
                ],
                owner: 'Outreach Coordinator',
                dueDate: '',
                status: 'not-started',
                budgetAmount: 15000,
                estimatedHours: 30,
                dependencies: [],
                notes: 'Engage with K-12 students through interactive demonstrations'
              },
              {
                id: crypto.randomUUID(),
                title: 'Develop Age-Appropriate Curriculum',
                description: 'Create lesson plans and activities tailored for elementary, middle, and high school audiences',
                deliverables: [
                  'Elementary school curriculum (grades 3-5)',
                  'Middle school curriculum (grades 6-8)',
                  'High school curriculum (grades 9-12)',
                  'Teacher/facilitator guides'
                ],
                owner: 'Education Team',
                dueDate: '',
                status: 'not-started',
                budgetAmount: 5000,
                estimatedHours: 60,
                dependencies: [],
                notes: 'Include diverse representation in all materials'
              },
              {
                id: crypto.randomUUID(),
                title: 'Schedule and Conduct Mini-Med Sessions',
                description: 'Coordinate with DC schools to schedule and deliver Mini-Med School sessions throughout academic year',
                deliverables: [
                  'School partnership agreements',
                  'Event calendar (20+ sessions)',
                  'Attendance records',
                  'Student feedback surveys'
                ],
                owner: 'Program Coordinator',
                dueDate: '',
                status: 'not-started',
                budgetAmount: 8000,
                estimatedHours: 100,
                dependencies: ['Develop Age-Appropriate Curriculum'],
                notes: 'Target underserved DC communities'
              },
              {
                id: crypto.randomUUID(),
                title: 'Evaluate Program Impact',
                description: 'Assess effectiveness of Mini-Med program in increasing interest in medicine among participants',
                deliverables: [
                  'Pre/post interest surveys',
                  'Longitudinal tracking plan',
                  'Impact report',
                  'Success stories/testimonials'
                ],
                owner: 'Assessment Team',
                dueDate: '',
                status: 'not-started',
                budgetAmount: 2000,
                estimatedHours: 40,
                dependencies: ['Schedule and Conduct Mini-Med Sessions'],
                notes: 'Track participants through high school and college'
              }
            ]
          },
          {
            id: crypto.randomUUID(),
            number: '2b',
            title: 'STEM Engagement and Career Exposure',
            description: 'Provide hands-on STEM activities and expose youth to diverse healthcare careers beyond physician',
            status: 'in-progress',
            completionPercentage: 0,
            assignedTo: 'STEM Outreach Team',
            targetDate: '',
            budgetAllocation: 23318,
            activities: [
              {
                id: crypto.randomUUID(),
                title: 'Develop Healthcare Career Exploration Program',
                description: 'Create program showcasing diverse health careers: nursing, PT, pharmacy, public health, research',
                deliverables: [
                  'Career exploration curriculum',
                  'Guest speaker series',
                  'Job shadow opportunities',
                  'Career pathway guides'
                ],
                owner: 'Career Services + Faculty',
                dueDate: '',
                status: 'not-started',
                budgetAmount: 8000,
                estimatedHours: 50,
                dependencies: [],
                notes: 'Feature alumni and local healthcare professionals'
              },
              {
                id: crypto.randomUUID(),
                title: 'Host STEM Summer Camp',
                description: 'Organize week-long summer camp for middle/high school students with lab tours, simulations, mentorship',
                deliverables: [
                  'Camp curriculum and schedule',
                  'Participant recruitment (50 students)',
                  'Medical student mentor assignments',
                  'Camp evaluation report'
                ],
                owner: 'Summer Programs Office',
                dueDate: '',
                status: 'not-started',
                budgetAmount: 12000,
                estimatedHours: 80,
                dependencies: [],
                notes: 'Partner with local community centers for recruitment'
              },
              {
                id: crypto.randomUUID(),
                title: 'Create Marketing Materials',
                description: 'Design flyers, videos, social media content to promote programs to underserved communities',
                deliverables: [
                  'Program flyers and posters',
                  'Promotional video',
                  'Social media campaign',
                  'Parent information packets'
                ],
                owner: 'Marketing Team',
                dueDate: '',
                status: 'not-started',
                budgetAmount: 3318,
                estimatedHours: 30,
                dependencies: [],
                notes: 'Translate materials into Spanish'
              }
            ]
          }
        ],
        kpis: [
          {
            id: crypto.randomUUID(),
            name: 'Number of Youth Participants Reached',
            description: 'Total K-12 students engaged through Mini-Med School and STEM programs',
            targetValue: '500',
            currentValue: '0',
            unit: 'students',
            measurementFrequency: 'annually',
            percentComplete: 0,
            status: 'on-track',
            lastMeasured: '',
            nextMeasurement: '',
            measurements: []
          },
          {
            id: crypto.randomUUID(),
            name: 'Participant Interest in Healthcare Careers',
            description: 'Percentage of participants reporting increased interest in healthcare careers post-program',
            targetValue: '75',
            currentValue: '0',
            unit: 'percentage',
            measurementFrequency: 'annually',
            percentComplete: 0,
            status: 'pending',
            lastMeasured: '',
            nextMeasurement: '',
            measurements: []
          }
        ],
        milestones: [
          {
            id: crypto.randomUUID(),
            title: 'Launch Expanded Mini-Med School',
            description: 'Conduct first expanded Mini-Med sessions in DC schools',
            targetDate: '',
            completedDate: null,
            completed: false,
            status: 'pending',
            dependencies: []
          },
          {
            id: crypto.randomUUID(),
            title: 'Host Inaugural STEM Summer Camp',
            description: 'Successfully complete first summer camp for 50 students',
            targetDate: '',
            completedDate: null,
            completed: false,
            status: 'pending',
            dependencies: []
          }
        ]
      },
      {
        id: crypto.randomUUID(),
        number: 'Aim 3',
        title: 'Aim 3 - Strengthening Academic Preparation (HUIPP)',
        description: 'Continue Howard University Intensive Pre-matriculation Program (HUIPP) to support incoming medical students',
        targetDate: '',
        status: 'in-progress',
        budgetAllocation: 150000,
        budgetSpent: 0,
        completionPercentage: 0,
        subAims: [
          {
            id: crypto.randomUUID(),
            number: '3a',
            title: 'HUIPP Year 2 Summer Program',
            description: '8-week intensive pre-matriculation program for 24 incoming M1 students',
            status: 'in-progress',
            completionPercentage: 0,
            assignedTo: 'HUIPP Director',
            targetDate: '',
            budgetAllocation: 150000,
            activities: [
              {
                id: crypto.randomUUID(),
                title: 'Recruit and Select HUIPP Cohort',
                description: 'Identify and admit 24 incoming medical students who would benefit from pre-matriculation support',
                deliverables: [
                  'Application and selection criteria',
                  'Accepted student list (24 students)',
                  'Enrollment confirmations',
                  'Pre-program assessment data'
                ],
                owner: 'Admissions + HUIPP Director',
                dueDate: '',
                status: 'not-started',
                budgetAmount: 5000,
                estimatedHours: 40,
                dependencies: [],
                notes: 'Target students from disadvantaged backgrounds'
              },
              {
                id: crypto.randomUUID(),
                title: 'Develop 8-Week Curriculum',
                description: 'Design comprehensive curriculum covering anatomy, physiology, biochemistry, study skills, test-taking strategies',
                deliverables: [
                  'Week-by-week curriculum plan',
                  'Lecture materials',
                  'Lab activities',
                  'Assessment schedule'
                ],
                owner: 'Faculty Curriculum Team',
                dueDate: '',
                status: 'not-started',
                budgetAmount: 15000,
                estimatedHours: 100,
                dependencies: [],
                notes: 'Align with Year 1 medical school content'
              },
              {
                id: crypto.randomUUID(),
                title: 'Provide Student Stipends',
                description: 'Disburse living stipends to support students during 8-week summer program',
                deliverables: [
                  'Stipend payment schedule',
                  'Financial disbursement records',
                  'Student acknowledgment forms',
                  'Budget tracking'
                ],
                owner: 'Financial Services',
                dueDate: '',
                status: 'not-started',
                budgetAmount: 84000,
                estimatedHours: 20,
                dependencies: ['Recruit and Select HUIPP Cohort'],
                notes: '$3,500 per student × 24 students'
              },
              {
                id: crypto.randomUUID(),
                title: 'Deliver Intensive Instruction',
                description: 'Conduct daily lectures, labs, and study sessions throughout 8-week program',
                deliverables: [
                  'Daily attendance records',
                  'Quiz and exam results',
                  'Lab completion logs',
                  'Student progress reports'
                ],
                owner: 'HUIPP Faculty',
                dueDate: '',
                status: 'not-started',
                budgetAmount: 30000,
                estimatedHours: 320,
                dependencies: ['Develop 8-Week Curriculum'],
                notes: 'Faculty teaching stipends included'
              },
              {
                id: crypto.randomUUID(),
                title: 'Assess Program Outcomes',
                description: 'Evaluate HUIPP effectiveness through pre/post assessments, Year 1 performance, and retention data',
                deliverables: [
                  'Pre/post knowledge assessments',
                  'Year 1 academic performance comparison',
                  'Retention rate analysis',
                  'Program impact report'
                ],
                owner: 'Assessment Office',
                dueDate: '',
                status: 'not-started',
                budgetAmount: 6000,
                estimatedHours: 50,
                dependencies: ['Deliver Intensive Instruction'],
                notes: 'Compare HUIPP vs non-HUIPP student outcomes'
              },
              {
                id: crypto.randomUUID(),
                title: 'Provide Program Materials and Textbooks',
                description: 'Distribute required textbooks and learning materials to all HUIPP participants',
                deliverables: [
                  'Textbook orders (anatomy, physiology, biochemistry)',
                  'Study guides and workbooks',
                  'Digital learning resources',
                  'Material distribution records'
                ],
                owner: 'Program Coordinator',
                dueDate: '',
                status: 'not-started',
                budgetAmount: 10000,
                estimatedHours: 30,
                dependencies: ['Recruit and Select HUIPP Cohort'],
                notes: 'Students keep materials for Year 1'
              }
            ]
          },
          {
            id: crypto.randomUUID(),
            number: '3b',
            title: 'Academic Skills Development',
            description: 'Build foundational study skills, time management, and test-taking strategies',
            status: 'not-started',
            completionPercentage: 0,
            assignedTo: 'Academic Success Team',
            targetDate: '',
            budgetAllocation: 0,
            activities: []
          },
          {
            id: crypto.randomUUID(),
            number: '3c',
            title: 'Clinical Skills Introduction',
            description: 'Early exposure to clinical reasoning, patient communication, and physical exam basics',
            status: 'not-started',
            completionPercentage: 0,
            assignedTo: 'Clinical Faculty',
            targetDate: '',
            budgetAllocation: 0,
            activities: []
          },
          {
            id: crypto.randomUUID(),
            number: '3d',
            title: 'Peer Cohort Building',
            description: 'Foster peer support networks and collaborative learning communities among HUIPP participants',
            status: 'not-started',
            completionPercentage: 0,
            assignedTo: 'Student Affairs',
            targetDate: '',
            budgetAllocation: 0,
            activities: []
          },
          {
            id: crypto.randomUUID(),
            number: '3e',
            title: 'Wellness and Self-Care',
            description: 'Introduce wellness practices, stress management, and self-care strategies for medical school',
            status: 'not-started',
            completionPercentage: 0,
            assignedTo: 'Wellness Center',
            targetDate: '',
            budgetAllocation: 0,
            activities: []
          },
          {
            id: crypto.randomUUID(),
            number: '3f',
            title: 'Program Evaluation and Follow-Up',
            description: 'Assess program effectiveness and provide ongoing support throughout Year 1',
            status: 'not-started',
            completionPercentage: 0,
            assignedTo: 'Assessment Team',
            targetDate: '',
            budgetAllocation: 0,
            activities: []
          }
        ],
        kpis: [
          {
            id: crypto.randomUUID(),
            name: 'HUIPP Student Retention Rate',
            description: 'Percentage of HUIPP participants who progress to Year 2',
            targetValue: '95',
            currentValue: '0',
            unit: 'percentage',
            measurementFrequency: 'annually',
            percentComplete: 0,
            status: 'on-track',
            lastMeasured: '',
            nextMeasurement: '',
            measurements: []
          },
          {
            id: crypto.randomUUID(),
            name: 'HUIPP Academic Performance',
            description: 'Average Year 1 GPA of HUIPP participants vs. non-participants',
            targetValue: '3.5',
            currentValue: '0',
            unit: 'GPA',
            measurementFrequency: 'annually',
            percentComplete: 0,
            status: 'pending',
            lastMeasured: '',
            nextMeasurement: '',
            measurements: []
          }
        ],
        milestones: [
          {
            id: crypto.randomUUID(),
            title: 'Complete HUIPP Year 2 Cohort Selection',
            description: 'Admit 24 students to HUIPP summer program',
            targetDate: '',
            completedDate: null,
            completed: false,
            status: 'pending',
            dependencies: []
          },
          {
            id: crypto.randomUUID(),
            title: 'Successfully Complete 8-Week Program',
            description: 'All students complete HUIPP with passing grades',
            targetDate: '',
            completedDate: null,
            completed: false,
            status: 'pending',
            dependencies: []
          }
        ]
      },
      {
        id: crypto.randomUUID(),
        number: 'Aim 4',
        title: 'Aim 4 - Comprehensive Student Support Services',
        description: 'Address financial barriers through food pantry, emergency housing, research funding, and mental health resources',
        targetDate: '',
        status: 'in-progress',
        budgetAllocation: 284000,
        budgetSpent: 0,
        completionPercentage: 0,
        subAims: [
          {
            id: crypto.randomUUID(),
            number: '4a',
            title: 'Food Security Initiative',
            description: 'Establish and maintain food pantry stocked with healthy groceries for medical students',
            status: 'in-progress',
            completionPercentage: 0,
            assignedTo: 'Student Affairs',
            targetDate: '',
            budgetAllocation: 80000,
            activities: [
              {
                id: crypto.randomUUID(),
                title: 'Set Up Food Pantry Space',
                description: 'Designate location, install shelving, refrigeration, and organize pantry logistics',
                deliverables: [
                  'Pantry location secured',
                  'Shelving and storage installed',
                  'Refrigerator/freezer',
                  'Operating procedures manual'
                ],
                owner: 'Facilities + Student Affairs',
                dueDate: '',
                status: 'not-started',
                budgetAmount: 10000,
                estimatedHours: 40,
                dependencies: [],
                notes: 'Accessible location within medical school building'
              },
              {
                id: crypto.randomUUID(),
                title: 'Stock Pantry with Healthy Food',
                description: 'Purchase and regularly restock pantry with nutritious groceries, fresh produce, protein, grains',
                deliverables: [
                  'Monthly grocery orders',
                  'Inventory tracking system',
                  'Food distribution logs',
                  'Student utilization data'
                ],
                owner: 'Pantry Coordinator',
                dueDate: '',
                status: 'not-started',
                budgetAmount: 60000,
                estimatedHours: 200,
                dependencies: ['Set Up Food Pantry Space'],
                notes: '$30K per year for 2 years'
              },
              {
                id: crypto.randomUUID(),
                title: 'Promote Pantry Services',
                description: 'Market food pantry to students, reduce stigma, ensure all students know about resource',
                deliverables: [
                  'Marketing materials',
                  'Student orientation presentation',
                  'Confidential access system',
                  'Usage statistics'
                ],
                owner: 'Student Affairs',
                dueDate: '',
                status: 'not-started',
                budgetAmount: 5000,
                estimatedHours: 30,
                dependencies: ['Set Up Food Pantry Space'],
                notes: 'Emphasize confidentiality and no-questions-asked access'
              },
              {
                id: crypto.randomUUID(),
                title: 'Evaluate Food Insecurity Impact',
                description: 'Assess pantry usage, student food security status, and impact on academic performance',
                deliverables: [
                  'Food security screening survey',
                  'Pantry utilization report',
                  'Student feedback',
                  'Correlation with academic outcomes'
                ],
                owner: 'Assessment Team',
                dueDate: '',
                status: 'not-started',
                budgetAmount: 5000,
                estimatedHours: 40,
                dependencies: ['Stock Pantry with Healthy Food'],
                notes: 'USDA food security survey tool'
              }
            ]
          },
          {
            id: crypto.randomUUID(),
            number: '4b',
            title: 'Emergency Financial Assistance',
            description: 'Provide emergency housing support and microgrants for students facing financial crises',
            status: 'in-progress',
            completionPercentage: 0,
            assignedTo: 'Financial Aid Office',
            targetDate: '',
            budgetAllocation: 80000,
            activities: [
              {
                id: crypto.randomUUID(),
                title: 'Establish Emergency Housing Fund',
                description: 'Create fund to assist students with short-term housing needs due to financial hardship',
                deliverables: [
                  'Fund policies and eligibility criteria',
                  'Application process',
                  'Disbursement procedures',
                  'Tracking system'
                ],
                owner: 'Financial Aid + Student Affairs',
                dueDate: '',
                status: 'not-started',
                budgetAmount: 60000,
                estimatedHours: 30,
                dependencies: [],
                notes: 'Awards up to $3,000 per student for rent/security deposits'
              },
              {
                id: crypto.randomUUID(),
                title: 'Create Emergency Microgrant Program',
                description: 'Offer small grants ($500-$2,000) for unexpected expenses: medical, family, transportation',
                deliverables: [
                  'Microgrant application form',
                  'Review committee',
                  'Rapid disbursement process (48-72 hrs)',
                  'Award records'
                ],
                owner: 'Dean of Students',
                dueDate: '',
                status: 'not-started',
                budgetAmount: 15000,
                estimatedHours: 25,
                dependencies: [],
                notes: 'Fast-track approval for urgent needs'
              },
              {
                id: crypto.randomUUID(),
                title: 'Promote Emergency Support Services',
                description: 'Ensure all students aware of available emergency financial resources',
                deliverables: [
                  'Student handbook section',
                  'Email communications',
                  'Orientation presentations',
                  'Advisor training'
                ],
                owner: 'Communications Team',
                dueDate: '',
                status: 'not-started',
                budgetAmount: 3000,
                estimatedHours: 20,
                dependencies: [],
                notes: 'Destigmatize asking for help'
              },
              {
                id: crypto.randomUUID(),
                title: 'Track and Report Outcomes',
                description: 'Monitor fund usage, assess impact on retention and well-being',
                deliverables: [
                  'Quarterly usage reports',
                  'Student outcome tracking',
                  'Retention analysis',
                  'Fund sustainability assessment'
                ],
                owner: 'Assessment Office',
                dueDate: '',
                status: 'not-started',
                budgetAmount: 2000,
                estimatedHours: 30,
                dependencies: ['Establish Emergency Housing Fund', 'Create Emergency Microgrant Program'],
                notes: 'Document impact stories (anonymized)'
              }
            ]
          }
        ],
        kpis: [
          {
            id: crypto.randomUUID(),
            name: 'Student Food Security Rate',
            description: 'Percentage of students reporting food security',
            targetValue: '90',
            currentValue: '0',
            unit: 'percentage',
            measurementFrequency: 'bi-annually',
            percentComplete: 0,
            status: 'pending',
            lastMeasured: '',
            nextMeasurement: '',
            measurements: []
          },
          {
            id: crypto.randomUUID(),
            name: 'Emergency Fund Utilization',
            description: 'Number of students assisted through emergency housing/microgrants',
            targetValue: '50',
            currentValue: '0',
            unit: 'students',
            measurementFrequency: 'annually',
            percentComplete: 0,
            status: 'on-track',
            lastMeasured: '',
            nextMeasurement: '',
            measurements: []
          },
          {
            id: crypto.randomUUID(),
            name: 'Student Research Productivity',
            description: 'Number of student-authored publications and presentations',
            targetValue: '40',
            currentValue: '0',
            unit: 'publications/presentations',
            measurementFrequency: 'annually',
            percentComplete: 0,
            status: 'on-track',
            lastMeasured: '',
            nextMeasurement: '',
            measurements: []
          }
        ],
        milestones: [
          {
            id: crypto.randomUUID(),
            title: 'Launch Food Pantry',
            description: 'Food pantry operational and available to all students',
            targetDate: '',
            completedDate: null,
            completed: false,
            status: 'pending',
            dependencies: []
          },
          {
            id: crypto.randomUUID(),
            title: 'Activate Emergency Support Fund',
            description: 'Emergency housing and microgrant programs accepting applications',
            targetDate: '',
            completedDate: null,
            completed: false,
            status: 'pending',
            dependencies: []
          },
          {
            id: crypto.randomUUID(),
            title: 'Expand Mental Health Services',
            description: 'Increased counseling availability and wellness programs launched',
            targetDate: '',
            completedDate: null,
            completed: false,
            status: 'pending',
            dependencies: []
          }
        ]
      },
      {
        id: crypto.randomUUID(),
        number: 'Aim 5',
        title: 'Aim 5 - Faculty Development and Well-Being',
        description: 'Support faculty research, wellness, and leadership development to improve retention and productivity',
        targetDate: '',
        status: 'in-progress',
        budgetAllocation: 190000,
        budgetSpent: 0,
        completionPercentage: 0,
        subAims: [
          {
            id: crypto.randomUUID(),
            number: '5a',
            title: 'Faculty Research Grants',
            description: 'Provide seed funding ($15,000 each) to support faculty pilot studies and scholarly work',
            status: 'in-progress',
            completionPercentage: 0,
            assignedTo: 'Office of Faculty Development',
            targetDate: '',
            budgetAllocation: 150000,
            activities: [
              {
                id: crypto.randomUUID(),
                title: 'Launch Faculty Research Grant Program',
                description: 'Announce internal grant program, distribute RFP, establish review process',
                deliverables: [
                  'Grant announcement and RFP',
                  'Application portal',
                  'Review committee roster',
                  'Evaluation rubric'
                ],
                owner: 'Research Office',
                dueDate: '',
                status: 'not-started',
                budgetAmount: 5000,
                estimatedHours: 30,
                dependencies: [],
                notes: 'Prioritize junior faculty and URMs'
              },
              {
                id: crypto.randomUUID(),
                title: 'Review Applications and Award Grants',
                description: 'Conduct peer review, select awardees (5 per year), notify recipients',
                deliverables: [
                  'Grant applications reviewed',
                  'Award selection justifications',
                  'Notification letters',
                  'Award agreements'
                ],
                owner: 'Grant Review Committee',
                dueDate: '',
                status: 'not-started',
                budgetAmount: 75000,
                estimatedHours: 40,
                dependencies: ['Launch Faculty Research Grant Program'],
                notes: 'Year 1: $75K for 5 grants @ $15K each'
              },
              {
                id: crypto.randomUUID(),
                title: 'Provide Grant Management Support',
                description: 'Assist awardees with budget management, IRB submissions, data collection',
                deliverables: [
                  'Grant orientation session',
                  'Budget tracking templates',
                  'IRB submission support',
                  'Progress report schedule'
                ],
                owner: 'Research Administration',
                dueDate: '',
                status: 'not-started',
                budgetAmount: 5000,
                estimatedHours: 60,
                dependencies: ['Review Applications and Award Grants'],
                notes: 'Mentorship from senior faculty'
              },
              {
                id: crypto.randomUUID(),
                title: 'Monitor Grant Progress and Outcomes',
                description: 'Track deliverables, publications, external funding secured as result of pilot data',
                deliverables: [
                  'Quarterly progress reports',
                  'Final reports from all awardees',
                  'Publications list',
                  'Follow-on funding secured'
                ],
                owner: 'Research Office',
                dueDate: '',
                status: 'not-started',
                budgetAmount: 5000,
                estimatedHours: 50,
                dependencies: ['Review Applications and Award Grants'],
                notes: 'ROI: Track R01s and other external grants secured'
              },
              {
                id: crypto.randomUUID(),
                title: 'Award Year 2 Grants',
                description: 'Conduct second round of internal grant competition for Year 2',
                deliverables: [
                  'Year 2 RFP',
                  '5 new awards',
                  'Award disbursements',
                  'Kickoff meetings'
                ],
                owner: 'Research Office',
                dueDate: '',
                status: 'not-started',
                budgetAmount: 60000,
                estimatedHours: 40,
                dependencies: ['Launch Faculty Research Grant Program'],
                notes: 'Year 2: $60K budget (adjusted)'
              }
            ]
          },
          {
            id: crypto.randomUUID(),
            number: '5b',
            title: 'Faculty Wellness and Leadership',
            description: 'Offer wellness programs, stress reduction, leadership training to combat faculty burnout',
            status: 'in-progress',
            completionPercentage: 0,
            assignedTo: 'Faculty Development Office',
            targetDate: '',
            budgetAllocation: 40000,
            activities: [
              {
                id: crypto.randomUUID(),
                title: 'Launch Faculty Wellness Programs',
                description: 'Develop and implement wellness initiatives: mindfulness, fitness, work-life balance workshops',
                deliverables: [
                  'Wellness program calendar',
                  'Workshop facilitators',
                  'Participation tracking',
                  'Faculty feedback surveys'
                ],
                owner: 'Faculty Wellness Committee',
                dueDate: '',
                status: 'not-started',
                budgetAmount: 15000,
                estimatedHours: 80,
                dependencies: [],
                notes: 'Address burnout, promote resilience'
              },
              {
                id: crypto.randomUUID(),
                title: 'Offer Leadership Development Training',
                description: 'Provide leadership academies, management training, administrative skill building for faculty',
                deliverables: [
                  'Leadership academy curriculum',
                  'Cohort of 20-25 faculty',
                  'Completion certificates',
                  'Post-training evaluation'
                ],
                owner: 'Faculty Development Office',
                dueDate: '',
                status: 'not-started',
                budgetAmount: 15000,
                estimatedHours: 100,
                dependencies: [],
                notes: 'Prepare faculty for administrative roles'
              },
              {
                id: crypto.randomUUID(),
                title: 'Host Annual Faculty Retreat',
                description: 'Organize college-wide retreat focused on community building, collaboration, and renewal',
                deliverables: [
                  'Retreat agenda and activities',
                  'Venue and logistics',
                  'Team-building exercises',
                  'Post-retreat survey'
                ],
                owner: 'Dean Office + Planning Committee',
                dueDate: '',
                status: 'not-started',
                budgetAmount: 8000,
                estimatedHours: 60,
                dependencies: [],
                notes: 'Off-site location, 2-day retreat'
              },
              {
                id: crypto.randomUUID(),
                title: 'Assess Faculty Well-Being and Retention',
                description: 'Measure faculty burnout, job satisfaction, intent to stay; track retention rates',
                deliverables: [
                  'Faculty climate survey',
                  'Burnout assessment (MBI)',
                  'Retention rate analysis',
                  'Well-being report'
                ],
                owner: 'HR + Assessment Office',
                dueDate: '',
                status: 'not-started',
                budgetAmount: 2000,
                estimatedHours: 40,
                dependencies: [],
                notes: 'Compare baseline to post-intervention'
              }
            ]
          },
          {
            id: crypto.randomUUID(),
            number: '5c',
            title: 'Faculty Recognition and Promotion Support',
            description: 'Support faculty in building portfolios for promotion, recognition awards, and career advancement',
            status: 'not-started',
            completionPercentage: 0,
            assignedTo: 'Faculty Development Office',
            targetDate: '',
            budgetAllocation: 0,
            activities: []
          }
        ],
        kpis: [
          {
            id: crypto.randomUUID(),
            name: 'Faculty Research Productivity',
            description: 'Number of publications, grants submitted, and grants awarded by faculty',
            targetValue: 'X% increase',
            currentValue: '0',
            unit: 'publications/grants',
            measurementFrequency: 'annually',
            percentComplete: 0,
            status: 'on-track',
            lastMeasured: '',
            nextMeasurement: '',
            measurements: []
          },
          {
            id: crypto.randomUUID(),
            name: 'Faculty Retention Rate',
            description: 'Percentage of faculty retained year-over-year',
            targetValue: '90',
            currentValue: '0',
            unit: 'percentage',
            measurementFrequency: 'annually',
            percentComplete: 0,
            status: 'pending',
            lastMeasured: '',
            nextMeasurement: '',
            measurements: []
          },
          {
            id: crypto.randomUUID(),
            name: 'External Funding Secured from Pilot Data',
            description: 'Dollar amount of external grants obtained using internal grant pilot data',
            targetValue: '500000',
            currentValue: '0',
            unit: 'dollars',
            measurementFrequency: 'bi-annually',
            percentComplete: 0,
            status: 'on-track',
            lastMeasured: '',
            nextMeasurement: '',
            measurements: []
          }
        ],
        milestones: [
          {
            id: crypto.randomUUID(),
            title: 'Award First Round of Faculty Research Grants',
            description: 'Select and fund 5 faculty research projects',
            targetDate: '',
            completedDate: null,
            completed: false,
            status: 'pending',
            dependencies: []
          },
          {
            id: crypto.randomUUID(),
            title: 'Launch Faculty Wellness Programs',
            description: 'Wellness workshops and leadership training operational',
            targetDate: '',
            completedDate: null,
            completed: false,
            status: 'pending',
            dependencies: []
          },
          {
            id: crypto.randomUUID(),
            title: 'Complete Faculty Retreat',
            description: 'Successfully host inaugural faculty retreat',
            targetDate: '',
            completedDate: null,
            completed: false,
            status: 'pending',
            dependencies: []
          }
        ]
      }
    ],
    documents: [],
    budgetDetails: {
      personnel: {
        projectDirector: { salary: 80000, fringe: 21680, years: 2, total: 203360 },
        studentAssistant: { amount: 15000, years: 2, total: 30000 },
        total: 233360
      },
      aim1: {
        software: 75000,
        mentorship: 60000,
        curriculumGrants: 24000,
        total: 159000
      },
      aim2: {
        total: 53318 // 5% of estimated total
      },
      aim3: {
        huipp: 150000,
        total: 150000
      },
      aim4: {
        foodPantry: 16000,
        facultyFood: 4000,
        studentSupport: 200000,
        publicationFees: 32000,
        studentTravel: 32000,
        total: 284000
      },
      aim5: {
        facultyGrants: 150000,
        wellbeing: 40000,
        total: 190000
      },
      travel: {
        professionalDevelopment: 7000,
        total: 7000
      },
      grandTotal: 1066360
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
};

export const createRWJFBudget = (grantId) => {
  return {
    grantId: grantId,
    totalBudget: 1066360,
    fiscalYear: new Date().getFullYear(),
    categories: [
      {
        id: crypto.randomUUID(),
        name: 'Personnel',
        allocated: 233360,
        miniPools: [
          {
            id: crypto.randomUUID(),
            description: 'Project Director - 100% FTE (2 years)',
            allocated: 80000,
            notes: 'Day-to-day execution, program planning, liaison for grant activities',
            expenses: []
          },
          {
            id: crypto.randomUUID(),
            description: 'Project Director - Fringe Benefits (27.4%)',
            allocated: 21680,
            notes: 'Annual fringe rate',
            expenses: []
          },
          {
            id: crypto.randomUUID(),
            description: 'Dr. Marjorie C. Gondré-Lewis - PI (10% effort)',
            allocated: 0,
            notes: 'Associate Dean for Faculty Development & JEDI - Oversees all DEI expenditures',
            expenses: []
          },
          {
            id: crypto.randomUUID(),
            description: 'Graduate/Undergraduate Student Support (Part-time, 2 years)',
            allocated: 15000,
            notes: 'Assist project director on outreach activities and data analysis',
            expenses: []
          },
          {
            id: crypto.randomUUID(),
            description: 'Year 2 - Project Director Salary',
            allocated: 80000,
            notes: 'Year 2 continuation',
            expenses: []
          },
          {
            id: crypto.randomUUID(),
            description: 'Year 2 - Project Director Fringe',
            allocated: 21680,
            notes: 'Year 2 fringe benefits',
            expenses: []
          },
          {
            id: crypto.randomUUID(),
            description: 'Year 2 - Student Support',
            allocated: 15000,
            notes: 'Year 2 continuation',
            expenses: []
          }
        ],
        description: 'Project Director ($101,680/yr × 2), Student Assistant ($15K/yr × 2) = $233,360'
      },
      {
        id: crypto.randomUUID(),
        name: 'Aim 1 - DEI Infrastructure (25%)',
        allocated: 159000,
        miniPools: [
          {
            id: crypto.randomUUID(),
            description: 'DEI Dashboard Software - Year 1',
            allocated: 50000,
            notes: 'Interactive dashboard tracking 10+ DEI metrics in real time',
            expenses: []
          },
          {
            id: crypto.randomUUID(),
            description: 'DEI Dashboard Software - Year 2 (Maintenance)',
            allocated: 25000,
            notes: 'Annual maintenance and updates',
            expenses: []
          },
          {
            id: crypto.randomUUID(),
            description: 'Mentorship Network Development - Year 1',
            allocated: 30000,
            notes: '3-tiered model: Faculty-student pairing, peer circles, impact dashboard',
            expenses: []
          },
          {
            id: crypto.randomUUID(),
            description: 'Mentorship Network Development - Year 2',
            allocated: 30000,
            notes: 'Continuation and expansion of mentorship program',
            expenses: []
          },
          {
            id: crypto.randomUUID(),
            description: 'Curriculum Innovation Microgrants - Year 1 (4 faculty @ $3,000)',
            allocated: 12000,
            notes: 'Incentivize faculty to redesign courses with JEDI principles',
            expenses: []
          },
          {
            id: crypto.randomUUID(),
            description: 'Curriculum Innovation Microgrants - Year 2 (4 faculty @ $3,000)',
            allocated: 12000,
            notes: 'Year 2 curriculum innovation awards',
            expenses: []
          }
        ],
        description: 'Software $75K, Mentorship $60K, Curriculum grants $24K'
      },
      {
        id: crypto.randomUUID(),
        name: 'Aim 2 - Youth Pipeline (5%)',
        allocated: 53318,
        miniPools: [
          {
            id: crypto.randomUUID(),
            description: 'Mini-Med School Materials - Year 1',
            allocated: 15000,
            notes: 'Anatomical models, lab supplies, teaching materials for K-12 outreach',
            expenses: []
          },
          {
            id: crypto.randomUUID(),
            description: 'Mini-Med School Materials - Year 2',
            allocated: 15000,
            notes: 'Replenish materials and expand program reach',
            expenses: []
          },
          {
            id: crypto.randomUUID(),
            description: 'STEM Kits and Interactive Activities',
            allocated: 10000,
            notes: 'Hands-on learning kits for community engagement',
            expenses: []
          },
          {
            id: crypto.randomUUID(),
            description: 'Program Coordination and Logistics',
            allocated: 8318,
            notes: 'Event coordination, transportation, refreshments for participants',
            expenses: []
          },
          {
            id: crypto.randomUUID(),
            description: 'Marketing and Outreach Materials',
            allocated: 5000,
            notes: 'Flyers, banners, social media campaigns to reach underserved communities',
            expenses: []
          }
        ],
        description: 'Mini-Med School expansion, STEM materials'
      },
      {
        id: crypto.randomUUID(),
        name: 'Aim 3 - HUIPP Program (20%)',
        allocated: 150000,
        miniPools: [
          {
            id: crypto.randomUUID(),
            description: 'HUIPP Summer Program - Year 2 (24 students)',
            allocated: 120000,
            notes: '8-week intensive pre-matriculation program for incoming medical students',
            expenses: []
          },
          {
            id: crypto.randomUUID(),
            description: 'Student Stipends (24 students @ $3,500)',
            allocated: 84000,
            notes: 'Living stipends for participating students during summer program',
            expenses: []
          },
          {
            id: crypto.randomUUID(),
            description: 'Program Materials and Textbooks',
            allocated: 12000,
            notes: 'Course materials, anatomy textbooks, study resources',
            expenses: []
          },
          {
            id: crypto.randomUUID(),
            description: 'Faculty Teaching Stipends',
            allocated: 18000,
            notes: 'Compensation for faculty teaching in summer program',
            expenses: []
          },
          {
            id: crypto.randomUUID(),
            description: 'Program Assessment and Evaluation',
            allocated: 6000,
            notes: 'Pre/post assessments, retention tracking, outcome measurement',
            expenses: []
          }
        ],
        description: 'Year 2 summer program for 24 students'
      },
      {
        id: crypto.randomUUID(),
        name: 'Aim 4 - Student Support (30%)',
        allocated: 284000,
        miniPools: [
          {
            id: crypto.randomUUID(),
            description: 'Food Pantry Operations - Year 1',
            allocated: 40000,
            notes: 'Stock medical student food pantry with healthy groceries',
            expenses: []
          },
          {
            id: crypto.randomUUID(),
            description: 'Food Pantry Operations - Year 2',
            allocated: 40000,
            notes: 'Continued pantry operations and expansion',
            expenses: []
          },
          {
            id: crypto.randomUUID(),
            description: 'Emergency Housing Assistance Fund',
            allocated: 60000,
            notes: 'Short-term housing assistance for students facing financial crises',
            expenses: []
          },
          {
            id: crypto.randomUUID(),
            description: 'Student Research Publication Fees',
            allocated: 24000,
            notes: 'Cover open-access publication fees for student research',
            expenses: []
          },
          {
            id: crypto.randomUUID(),
            description: 'Student Conference Travel - Year 1',
            allocated: 30000,
            notes: 'Support students presenting research at national conferences',
            expenses: []
          },
          {
            id: crypto.randomUUID(),
            description: 'Student Conference Travel - Year 2',
            allocated: 30000,
            notes: 'Continued conference travel support',
            expenses: []
          },
          {
            id: crypto.randomUUID(),
            description: 'Mental Health and Wellness Resources',
            allocated: 25000,
            notes: 'Counseling services, stress management workshops, peer support',
            expenses: []
          },
          {
            id: crypto.randomUUID(),
            description: 'Emergency Financial Aid Microgrants',
            allocated: 20000,
            notes: 'Small grants for unexpected expenses (medical, family, etc.)',
            expenses: []
          },
          {
            id: crypto.randomUUID(),
            description: 'Technology and Study Resources',
            allocated: 15000,
            notes: 'Laptops, tablets, study software for students in need',
            expenses: []
          }
        ],
        description: 'Food pantry, emergency housing, research funds'
      },
      {
        id: crypto.randomUUID(),
        name: 'Aim 5 - Faculty Development (20%)',
        allocated: 190000,
        miniPools: [
          {
            id: crypto.randomUUID(),
            description: 'Faculty Research Grants - Year 1 (5 grants @ $15,000)',
            allocated: 75000,
            notes: 'Seed funding for pilot studies and scholarly activity',
            expenses: []
          },
          {
            id: crypto.randomUUID(),
            description: 'Faculty Research Grants - Year 2 (5 grants @ $15,000)',
            allocated: 75000,
            notes: 'Continued research support to build faculty portfolios',
            expenses: []
          },
          {
            id: crypto.randomUUID(),
            description: 'Faculty Wellness Programs',
            allocated: 20000,
            notes: 'Stress reduction workshops, burnout prevention, work-life balance initiatives',
            expenses: []
          },
          {
            id: crypto.randomUUID(),
            description: 'Leadership Development Training',
            allocated: 15000,
            notes: 'Leadership academies, management training, career advancement workshops',
            expenses: []
          },
          {
            id: crypto.randomUUID(),
            description: 'Faculty Retreat and Team Building',
            allocated: 5000,
            notes: 'Annual faculty retreat focusing on collaboration and community building',
            expenses: []
          }
        ],
        description: 'Research grants $150K, wellness/leadership $40K'
      },
      {
        id: crypto.randomUUID(),
        name: 'Travel',
        allocated: 39000,
        miniPools: [
          {
            id: crypto.randomUUID(),
            description: 'PI Professional Development - National Conferences',
            allocated: 8000,
            notes: 'Dr. Gondré-Lewis attendance at AAMC, DEI conferences',
            expenses: []
          },
          {
            id: crypto.randomUUID(),
            description: 'Project Director Professional Development',
            allocated: 6000,
            notes: 'Program management and grant administration conferences',
            expenses: []
          },
          {
            id: crypto.randomUUID(),
            description: 'Student Conference Travel - Medical Education',
            allocated: 10000,
            notes: 'Support for students presenting at medical education conferences',
            expenses: []
          },
          {
            id: crypto.randomUUID(),
            description: 'Student Conference Travel - Research Presentations',
            allocated: 10000,
            notes: 'Students presenting research findings at national meetings',
            expenses: []
          },
          {
            id: crypto.randomUUID(),
            description: 'Local Travel - Community Outreach',
            allocated: 5000,
            notes: 'Transportation for Mini-Med School and community engagement activities',
            expenses: []
          }
        ],
        description: 'Student conference travel, PI/director development'
      },
      {
        id: crypto.randomUUID(),
        name: 'Gift Cards/Participant Incentives',
        allocated: 10000,
        miniPools: [
          {
            id: crypto.randomUUID(),
            description: 'Participant Incentive Gift Cards',
            allocated: 10000,
            notes: 'Gift cards for program participants across all aims',
            expenses: [
              {
                id: crypto.randomUUID(),
                description: 'Vanilla Visa gift cards for Aim 5 participants (8 cards)',
                amount: 412.55,
                vendor: 'JP Morgan Chase',
                date: '2026-02-17',
                notes: 'Faculty wellness program participant incentives',
                receiptDocIds: [],
                createdAt: new Date('2026-02-17').toISOString()
              }
            ]
          }
        ],
        description: 'Gift cards for program participants'
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
};
