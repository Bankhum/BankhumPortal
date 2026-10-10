/**
 * Bankhum School Portal — เมนูระบบทั้งหมด
 * ------------------------------------------------------------
 * แก้ไขเมนูที่ไฟล์นี้ไฟล์เดียว หน้าเว็บจะสร้างปุ่มให้อัตโนมัติ
 *
 * วิธีเพิ่มลิงก์ให้เมนูที่ยังไม่มีลิงก์:
 *   ใส่ url: 'https://...'  ในเมนูนั้น  → ปุ่มจะเปลี่ยนจาก "เร็วๆ นี้" เป็นปุ่มเปิดระบบทันที
 *
 * ช่องข้อมูลของแต่ละเมนู
 *   th, en   ชื่อเมนู ไทย / อังกฤษ
 *   icon     ชื่อไอคอนจาก https://lucide.dev/icons (เวอร์ชัน 0.468)
 *   url      ลิงก์ระบบ (ไม่ใส่ = แสดงเป็น "เร็วๆ นี้")
 *   statId   รหัสสำหรับนับสถิติการใช้งาน (ใส่เมื่อมีลิงก์ ใช้รหัสเดิมเพื่อให้สถิตินับต่อเนื่อง)
 *   statName ชื่อที่แสดงบนกราฟสถิติ (ไม่ใส่ = ใช้ชื่อเมนู)
 *   keywords คำค้นเพิ่มเติม
 */
window.BANKHUM_MENU = [
  {
    id: 'mod-academic', no: '01', color: 'blue', icon: 'graduation-cap',
    th: 'งานวิชาการ', en: 'Academic Affairs', code: 'BANKHUM SIS', short: 'วิชาการ', shortEn: 'Academic',
    main: { url: 'https://sis.bankhum.ac.th/', statId: 'sis', th: 'เปิด BANKHUM SIS', en: 'Open BANKHUM SIS' },
    items: [
      { th: 'ข้อมูลนักเรียน', en: 'Student information', icon: 'id-card', url: 'https://sis.bankhum.ac.th/', statId: 'sis', statName: 'สารสนเทศนักเรียน (ใหม่)', keywords: 'sis สารสนเทศนักเรียน student' },
      { th: 'เช็กชื่อนักเรียน', en: 'Student attendance check', icon: 'user-check', keywords: 'เช็คชื่อ มาเรียน attendance' },
      { th: 'ตารางเรียน / ตารางสอน', en: 'Class & teaching timetable', icon: 'calendar-days', keywords: 'timetable schedule' },
      { th: 'วัดผลและประเมินผล', en: 'Measurement & evaluation', icon: 'clipboard-list', url: 'https://bankhum.krusarawut.com/login.php', statId: 'assessment-system', statName: 'ระบบวัดผลและประเมินผลโรงเรียน', keywords: 'คะแนน เกรด ผลการเรียน grade assessment' },
      { th: 'แผนการจัดการเรียนรู้ออนไลน์', en: 'Online lesson plans', icon: 'notebook-pen', url: 'https://script.google.com/a/macros/bankhum.ac.th/s/AKfycbyUZPqvNrehG-h_xLrX1_pNpSMbyxu-ZWPfb46n5l370yDaEzWINLqbGOAk7r38Xrv-/exec', statId: 'lessonplan', statName: 'สร้างแผนการสอนออนไลน์', keywords: 'แผนการสอน lesson plan' },
      { th: 'วิจัยในชั้นเรียน', en: 'Classroom research', icon: 'flask-conical', keywords: 'research' },
      { th: 'นิเทศภายใน', en: 'Internal supervision', icon: 'presentation', url: 'https://script.google.com/a/macros/bankhum.ac.th/s/AKfycbxSqnz3gYAjEPAiVe9YZ_ubhgA8Dqqyr1YE5Uf4kpYi0C-VVEL3ZaJC8ESFSoJltkkm/exec', statId: 'supervision', statName: 'ระบบนิเทศการจัดกิจกรรมการเรียนการสอน', keywords: 'นิเทศ supervision การเรียนการสอน' }
    ]
  },
  {
    id: 'mod-budget', no: '02', color: 'green', icon: 'wallet',
    th: 'งบประมาณ', en: 'Budget & Finance', code: 'BK Management', short: 'งบประมาณ', shortEn: 'Budget',
    items: [
      { th: 'แผนพัฒนาการศึกษา', en: 'Education development plan', icon: 'map' },
      { th: 'แผนปฏิบัติการประจำปี', en: 'Annual action plan', icon: 'calendar-check' },
      { th: 'โครงการและกิจกรรม', en: 'Projects & activities', icon: 'folder-kanban', keywords: 'project' },
      { th: 'งบประมาณ', en: 'Budget', icon: 'wallet', keywords: 'budget' },
      { th: 'การเงินและพัสดุ', en: 'Finance & supplies', icon: 'banknote', url: 'https://script.google.com/a/macros/bankhum.ac.th/s/AKfycbwUz9mm1SC5LS2wpQPMDblnGBcJ2s4Y4-A073e42ZGrT_bIGuBLIc1nBylaj56LS_HiRw/exec', statId: 'finance', statName: 'ระบบบริหารการเงินและพัสดุโรงเรียน', keywords: 'การเงิน พัสดุ finance' },
      { th: 'จัดซื้อจัดจ้าง (e-GP)', en: 'Procurement (e-GP)', icon: 'package-check', keywords: 'จัดซื้อ จัดจ้าง egp procurement' }
    ]
  },
  {
    id: 'mod-hr', no: '03', color: 'orange', icon: 'users',
    th: 'บุคลากร', en: 'Human Resources', code: 'BANKHUM HR', short: 'บุคลากร', shortEn: 'HR',
    items: [
      { th: 'ข้อมูลบุคลากร', en: 'Staff information', icon: 'contact' },
      { th: 'การลาและลงเวลาปฏิบัติงาน', en: 'Leave & time attendance', icon: 'clock-3', url: 'https://zlink.minervaiot.com/login', statId: 'attendance', statName: 'ระบบลงเวลาครู', keywords: 'ลงเวลา ลา zlink attendance' },
      { th: 'แจ้งผลการเลื่อนขั้นเงินเดือน', en: 'Salary increment results', icon: 'badge-dollar-sign', url: 'https://money.bankhum.ac.th/', statId: 'salary', statName: 'ระบบแจ้งผลการเลื่อนขั้นเงินเดือน', keywords: 'เงินเดือน เลื่อนขั้น salary money bkmoney' },
      { th: 'PA (ข้อตกลงในการพัฒนางาน)', en: 'PA (Performance agreement)', icon: 'handshake', keywords: 'pa วpa ข้อตกลง' },
      { th: 'SAR ครู (รายงานประเมินตนเอง)', en: 'Teacher SAR', icon: 'file-text', keywords: 'sar' },
      { th: 'ประเมินครูและบุคลากร', en: 'Teacher & staff evaluation', icon: 'star' },
      { th: 'ประเมินลูกจ้าง', en: 'Employee evaluation', icon: 'user-cog' }
    ]
  },
  {
    id: 'mod-general', no: '04', color: 'violet', icon: 'landmark',
    th: 'บริหารทั่วไป', en: 'General Administration', code: 'BANKHUM GENERAL', short: 'บริหารทั่วไป', shortEn: 'General',
    items: [
      { th: 'ระบบสารสนเทศโรงเรียน', en: 'School information system', icon: 'chart-no-axes-combined', url: 'https://bankhum.com/login.php', statId: 'information', statName: 'ระบบสารสนเทศโรงเรียน', keywords: 'สารสนเทศ information' },
      { th: 'แจ้งซ่อมและบำรุงรักษา', en: 'Repair & maintenance requests', icon: 'wrench', keywords: 'ซ่อม repair' },
      { th: 'จองห้องประชุม / สถานที่', en: 'Room & venue booking', icon: 'calendar-clock', keywords: 'จองห้อง booking' },
      { th: 'ขอใช้รถโรงเรียน', en: 'School vehicle requests', icon: 'bus', keywords: 'รถ vehicle' },
      { th: 'งานเวรประจำวัน', en: 'Daily duty roster', icon: 'clipboard-check', keywords: 'เวร duty' },
      { th: 'อาคารสถานที่และความปลอดภัย', en: 'Facilities & safety', icon: 'shield-check' },
      { th: 'ประชาสัมพันธ์และชุมชนสัมพันธ์', en: 'Public & community relations', icon: 'megaphone' }
    ]
  },
  {
    id: 'mod-quality', no: '05', color: 'magenta', icon: 'target',
    th: 'แผนและคุณภาพ', en: 'Planning & Quality', code: 'BANKHUM SWOT & QA', short: 'แผน/คุณภาพ', shortEn: 'Quality',
    items: [
      { th: 'วิเคราะห์ SWOT', en: 'SWOT analysis', icon: 'grid-2x2', keywords: 'swot' },
      { th: 'TOWS Matrix', en: 'TOWS matrix', icon: 'layout-grid', keywords: 'tows' },
      { th: 'แผนพัฒนาคุณภาพ', en: 'Quality improvement plan', icon: 'trending-up' },
      { th: 'SAR สถานศึกษา', en: 'School SAR', icon: 'file-check', keywords: 'sar' },
      { th: 'โรงเรียนคุณภาพ', en: 'Quality School', icon: 'school', url: 'https://sites.google.com/bankhum.ac.th/onesqa5/ONESQA', statId: 'quality-school', statName: 'โรงเรียนคุณภาพ', keywords: 'quality school' },
      { th: 'ประเมิน สมศ. รอบ 5', en: 'ONESQA Round 5', icon: 'badge-check', url: 'https://sites.google.com/bankhum.ac.th/oneqa2568/ONESQA', statId: 'onesqa5', statName: 'ประเมิน สมศ. รอบ 5', keywords: 'สมศ onesqa ประกันคุณภาพภายนอก' },
      { th: 'รายงานและหลักฐาน', en: 'Reports & evidence', icon: 'folder-open' }
    ]
  },
  {
    id: 'mod-sarabun', no: '06', color: 'red', icon: 'file-text',
    th: 'สารบรรณ', en: 'E-Sarabun', code: 'E-Sarabun', short: 'สารบรรณ', shortEn: 'Sarabun',
    main: { url: 'https://sarabun.bankhum.ac.th/', statId: 'document', th: 'เปิดระบบสารบรรณ', en: 'Open E-Sarabun' },
    items: [
      { th: 'รับ–ส่ง หนังสือราชการ', en: 'Send & receive official letters', icon: 'send', url: 'https://sarabun.bankhum.ac.th/', statId: 'document', statName: 'ระบบงานสารบรรณ', keywords: 'สารบรรณ หนังสือราชการ ธุรการ sarabun document' },
      { th: 'ค้นหาเอกสาร', en: 'Document search', icon: 'file-search' },
      { th: 'แจ้งเตือนผ่าน LINE', en: 'LINE notifications', icon: 'bell-ring', url: 'https://lin.ee/pUEv7V7', statId: 'sarabun-line', statName: 'LINE E-SaraBun', keywords: 'line ไลน์ แจ้งเตือน' },
      { th: 'เอกสารเวียน', en: 'Circular documents', icon: 'files' },
      { th: 'แบบฟอร์มหนังสือราชการ', en: 'Official letter templates', icon: 'file-pen-line', keywords: 'แบบฟอร์ม template' },
      { th: 'รายงานสารบรรณ', en: 'Sarabun reports', icon: 'chart-column' }
    ]
  },
  {
    id: 'mod-student', no: '07', color: 'yellow', icon: 'backpack',
    th: 'นักเรียนและผู้ปกครอง', en: 'Students & Parents', code: 'BANKHUM STUDENT', short: 'นักเรียน', shortEn: 'Students',
    items: [
      { th: 'ข้อมูลของฉัน', en: 'My profile', icon: 'circle-user' },
      { th: 'ผลการเรียนและตารางเรียน', en: 'Grades & timetable', icon: 'award', url: 'https://bankhum.krusarawut.com/login.php', statId: 'assessment-system', statName: 'ระบบวัดผลและประเมินผลโรงเรียน', keywords: 'เกรด คะแนน ผลการเรียน grade' },
      { th: 'ประวัติการมาเรียน', en: 'Attendance history', icon: 'calendar-check' },
      { th: 'ออมทรัพย์นักเรียน', en: 'Student savings', icon: 'piggy-bank', url: 'https://script.google.com/macros/s/AKfycbzGwx_eA0a3ZBd0cTcPUXVU11mYOgXmjRJI-UHZVFyeKdKRwF7GQfPVCwiE2jh5mO1YGw/exec', statId: 'savings', statName: 'ระบบออมทรัพย์โรงเรียน', keywords: 'ออม เงินออม savings' },
      { th: 'สะสมความดี', en: 'Good deeds points', icon: 'medal', url: 'https://script.google.com/a/macros/bankhum.ac.th/s/AKfycbzgHjgJodLd6Cd-3xsqg2_vKnZYNS-p7EVS-MYQWcsKqPolVuSfl862zKsJqllfLf1QFg/exec', statId: 'goodstudent', statName: 'ระบบสะสมความดีนักเรียน', keywords: 'ความดี คะแนนความดี good student' },
      { th: 'อีเมล์ นักเรียน / ครู', en: 'Student / teacher email', icon: 'mail', url: 'https://email.bankhum.ac.th', statId: 'school-email', statName: 'อีเมล์ นักเรียน/ครู', keywords: 'อีเมล email mail' },
      { th: 'E-Portfolio (แฟ้มสะสมผลงาน)', en: 'E-Portfolio', icon: 'briefcase', keywords: 'portfolio แฟ้มสะสมผลงาน' }
    ]
  },
  {
    id: 'mod-executive', no: 'EX', color: 'teal', icon: 'layout-dashboard',
    th: 'ผู้บริหาร', en: 'Executive', code: 'Executive Dashboard', short: 'ผู้บริหาร', shortEn: 'Executive',
    items: [
      { th: 'สถิติการใช้งานระบบ', en: 'System usage statistics', icon: 'chart-no-axes-combined', url: '#dashboard', internal: true, keywords: 'สถิติ stats dashboard' },
      { th: 'ภาพรวมนักเรียนและการมาเรียน', en: 'Students & attendance overview', icon: 'users-round' },
      { th: 'ภาพรวมงบประมาณ', en: 'Budget overview', icon: 'chart-pie' },
      { th: 'สถานะโครงการ', en: 'Project status', icon: 'square-kanban' },
      { th: 'งานรอดำเนินการ', en: 'Pending tasks', icon: 'list-todo' },
      { th: 'อนุมัติโครงการ', en: 'Project approval', icon: 'stamp' }
    ]
  },
  {
    id: 'mod-pr', no: 'NEW', color: 'pink', icon: 'megaphone', isNew: true,
    th: 'ประชาสัมพันธ์และเว็บไซต์โรงเรียน', en: 'PR & School Website', code: 'NEWS & WEBSITE', short: 'ประชาสัมพันธ์', shortEn: 'News',
    items: [
      { th: 'เว็บไซต์โรงเรียน', en: 'School website', icon: 'globe', url: 'https://www.bankhum.ac.th', statId: 'website', statName: 'เว็บไซต์โรงเรียน', keywords: 'website เว็บไซต์ official' },
      { th: 'ข่าวสารและกิจกรรม', en: 'News & activities', icon: 'newspaper', keywords: 'ข่าว news' },
      { th: 'ประกาศจากโรงเรียน', en: 'School announcements', icon: 'megaphone', keywords: 'ประกาศ announcement' },
      { th: 'แกลเลอรีรูปภาพและวิดีโอ', en: 'Photo & video gallery', icon: 'images', keywords: 'รูป วิดีโอ gallery' },
      { th: 'เชื่อมต่อ Facebook / LINE', en: 'Facebook / LINE', icon: 'share-2', keywords: 'facebook line' },
      { th: 'จัดการเนื้อหาเว็บไซต์', en: 'Website content management', icon: 'pencil-line', keywords: 'cms' }
    ]
  }
];
