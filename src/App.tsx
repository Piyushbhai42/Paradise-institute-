import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  GraduationCap, 
  Trash2, 
  Plus, 
  Pencil,
  CheckCircle2, 
  XCircle, 
  Calendar,
  ChevronRight,
  LayoutDashboard,
  UsersRound,
  BookOpen,
  Info,
  History,
  Phone,
  User,
  Heart,
  Users2,
  Lock,
  Settings as SettingsIcon,
  LogOut,
  ClipboardList,
  Trophy,
  BarChart3,
  MessageCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Teacher, Class, Student, AttendanceRecord, Stats, TeacherAttendanceRecord, HomeworkRecord, TestMarkRecord, PerformanceSummary } from './types';

type View = 'dashboard' | 'teachers' | 'classes' | 'attendance' | 'teacher-attendance' | 'daily-data' | 'settings' | 'homework' | 'test-marks';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<'admin' | 'teacher' | null>(null);
  const [teacherInfo, setTeacherInfo] = useState<{ id: number, name: string } | null>(null);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [stats, setStats] = useState<Stats>({ teachers: 0, classes: 0, students: 0 });
  const [loading, setLoading] = useState(true);

  // Form states
  const [newTeacherName, setNewTeacherName] = useState('');
  const [teacherDetails, setTeacherDetails] = useState({
    phone: '',
    email: '',
    subject: '',
    qualification: '',
    experience: '',
    username: '',
    password: ''
  });
  const [newClassName, setNewClassName] = useState('');
  const [newStudentName, setNewStudentName] = useState('');
  const [studentDetails, setStudentDetails] = useState({
    phone: '',
    fatherName: '',
    motherName: '',
    brotherName: '',
    brotherClass: '',
    sisterName: '',
    sisterClass: ''
  });
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);
  const [viewingTeacher, setViewingTeacher] = useState<Teacher | null>(null);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceMarks, setAttendanceMarks] = useState<Record<number, 'present' | 'absent'>>({});
  const [teacherAttendanceMarks, setTeacherAttendanceMarks] = useState<Record<number, 'present' | 'absent'>>({});
  const [homeworkMarks, setHomeworkMarks] = useState<Record<number, 'done' | 'not done' | 'well done'>>({});
  const [testMarks, setTestMarks] = useState<Record<number, number>>({});
  const [testName, setTestName] = useState('');
  const [maxMarks, setMaxMarks] = useState(100);
  const [performanceSummary, setPerformanceSummary] = useState<PerformanceSummary | null>(null);
  const [performanceMonth, setPerformanceMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  
  // Daily Data States
  const [dailyDataDate, setDailyDataDate] = useState(new Date().toISOString().split('T')[0]);
  const [dailyStudentAttendance, setDailyStudentAttendance] = useState<any[]>([]);
  const [dailyTeacherAttendance, setDailyTeacherAttendance] = useState<any[]>([]);
  const [dailyDataClassId, setDailyDataClassId] = useState<string>('');
  const [studentSortBy, setStudentSortBy] = useState<'name' | 'id' | 'class'>('name');
  const [notification, setNotification] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  // Settings states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);
  const [whatsappSenderNumber, setWhatsappSenderNumber] = useState('');
  const [settingsMessage, setSettingsMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    const auth = localStorage.getItem('classTrackAuth');
    const role = localStorage.getItem('classTrackRole') as 'admin' | 'teacher';
    const tInfo = localStorage.getItem('classTrackTeacherInfo');
    
    if (auth === 'authenticated' || auth === 'teacher-auth') {
      setIsAuthenticated(true);
      setUserRole(role);
      if (tInfo) setTeacherInfo(JSON.parse(tInfo));
      fetchInitialData();
    }
  }, []);

  const showNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setNotification({ text, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUsername, password: loginPassword })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('classTrackAuth', data.token);
        localStorage.setItem('classTrackRole', data.role);
        if (data.teacherId) {
          const tInfo = { id: data.teacherId, name: data.teacherName };
          localStorage.setItem('classTrackTeacherInfo', JSON.stringify(tInfo));
          setTeacherInfo(tInfo);
        }
        setIsAuthenticated(true);
        setUserRole(data.role);
        fetchInitialData();
      } else {
        setLoginError(data.error || 'Invalid credentials');
      }
    } catch (err) {
      setLoginError('Connection error');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('classTrackAuth');
    localStorage.removeItem('classTrackRole');
    localStorage.removeItem('classTrackTeacherInfo');
    setIsAuthenticated(false);
    setUserRole(null);
    setTeacherInfo(null);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsMessage({ text: '', type: '' });
    try {
      const res = await fetch('/api/change-password', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-auth-token': 'authenticated'
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      if (res.ok) {
        setSettingsMessage({ text: 'Password changed successfully!', type: 'success' });
        setCurrentPassword('');
        setNewPassword('');
      } else {
        setSettingsMessage({ text: 'Invalid current password', type: 'error' });
      }
    } catch (err) {
      setSettingsMessage({ text: 'Connection error', type: 'error' });
    }
  };

  const apiFetch = async (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('classTrackAuth');
    const headers = {
      ...options.headers,
      'x-auth-token': token || ''
    };
    return fetch(url, { ...options, headers });
  };

  useEffect(() => {
    if (viewingStudent) {
      fetchPerformanceSummary(viewingStudent.id);
    } else {
      setPerformanceSummary(null);
    }
  }, [viewingStudent, performanceMonth]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [tRes, cRes, sRes, setRes] = await Promise.all([
        apiFetch('/api/teachers'),
        apiFetch('/api/classes'),
        apiFetch('/api/stats'),
        apiFetch('/api/settings')
      ]);
      const teachersData = await tRes.json();
      setTeachers(teachersData);
      setClasses(await cRes.json());
      setStats(await sRes.json());
      
      const settingsData = await setRes.json();
      if (settingsData.whatsapp_enabled) setWhatsappEnabled(settingsData.whatsapp_enabled === 'true');
      if (settingsData.whatsapp_sender_number) setWhatsappSenderNumber(settingsData.whatsapp_sender_number);

      // Initialize teacher attendance marks
      const tMarks: Record<number, 'present' | 'absent'> = {};
      teachersData.forEach((t: Teacher) => tMarks[t.id] = 'present');
      
      const tAttRes = await apiFetch(`/api/teacher-attendance?date=${attendanceDate}`);
      const tAttData = await tAttRes.json();
      if (tAttData.length > 0) {
        tAttData.forEach((a: any) => tMarks[a.teacher_id] = a.status);
      }
      setTeacherAttendanceMarks(tMarks);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async (classId: number) => {
    const url = classId === 0 ? '/api/students' : `/api/students?classId=${classId}`;
    const res = await apiFetch(url);
    const data = await res.json();
    setStudents(data);
    
    // Initialize marks
    const attMarks: Record<number, 'present' | 'absent'> = {};
    const hwMarks: Record<number, 'done' | 'not done' | 'well done'> = {};
    const tMarks: Record<number, number> = {};
    
    data.forEach((s: Student) => {
      attMarks[s.id] = 'present';
      hwMarks[s.id] = 'done';
      tMarks[s.id] = 0;
    });
    
    setAttendanceMarks(attMarks);
    setHomeworkMarks(hwMarks);
    setTestMarks(tMarks);

    // Try to fetch existing records for this date (only if specific class)
    if (classId !== 0) {
      const attRes = await apiFetch(`/api/attendance?date=${attendanceDate}&classId=${classId}`);
      const attData = await attRes.json();
      if (attData.length > 0) {
        const existingMarks: Record<number, 'present' | 'absent'> = {};
        attData.forEach((a: any) => existingMarks[a.student_id] = a.status);
        setAttendanceMarks(prev => ({ ...prev, ...existingMarks }));
      }

      const hwRes = await apiFetch(`/api/homework?date=${attendanceDate}&classId=${classId}`);
      const hwData = await hwRes.json();
      if (hwData.length > 0) {
        const existingHw: Record<number, 'done' | 'not done' | 'well done'> = {};
        hwData.forEach((h: any) => existingHw[h.student_id] = h.status);
        setHomeworkMarks(prev => ({ ...prev, ...existingHw }));
      }
    }
  };

  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeacherName.trim()) return;
    const res = await apiFetch('/api/teachers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newTeacherName, ...teacherDetails })
    });
    const teacher = await res.json();
    setTeachers([...teachers, teacher]);
    setNewTeacherName('');
    setTeacherDetails({
      phone: '',
      email: '',
      subject: '',
      qualification: '',
      experience: '',
      username: '',
      password: ''
    });
    showNotification('Teacher added successfully');
    fetchInitialData();
  };

  const handleDeleteTeacher = async (id: number) => {
    await apiFetch(`/api/teachers/${id}`, { method: 'DELETE' });
    setTeachers(teachers.filter(t => t.id !== id));
    showNotification('Teacher deleted');
    fetchInitialData();
  };

  const handleUpdateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeacher) return;
    const res = await apiFetch(`/api/teachers/${editingTeacher.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editingTeacher)
    });
    if (res.ok) {
      setEditingTeacher(null);
      showNotification('Teacher profile updated');
      fetchInitialData();
    }
  };

  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;
    const res = await apiFetch('/api/classes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newClassName })
    });
    if (res.ok) {
      const cls = await res.json();
      setClasses([...classes, cls]);
      setNewClassName('');
      fetchInitialData();
    }
  };

  const handleDeleteClass = async (id: number) => {
    await apiFetch(`/api/classes/${id}`, { method: 'DELETE' });
    setClasses(classes.filter(c => c.id !== id));
    if (selectedClass?.id === id) setSelectedClass(null);
    showNotification('Class deleted');
    fetchInitialData();
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim() || !selectedClass) return;
    const res = await apiFetch('/api/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        name: newStudentName, 
        classId: selectedClass.id,
        ...studentDetails
      })
    });
    const student = await res.json();
    setStudents([...students, student]);
    setNewStudentName('');
    setStudentDetails({
      phone: '',
      fatherName: '',
      motherName: '',
      brotherName: '',
      brotherClass: '',
      sisterName: '',
      sisterClass: ''
    });
    showNotification('Student added successfully');
    fetchInitialData();
  };

  const handleDeleteStudent = async (id: number) => {
    await apiFetch(`/api/students/${id}`, { method: 'DELETE' });
    setStudents(students.filter(s => s.id !== id));
    showNotification('Student deleted');
    fetchInitialData();
  };

  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    const res = await apiFetch(`/api/students/${editingStudent.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editingStudent)
    });
    if (res.ok) {
      setEditingStudent(null);
      showNotification('Student profile updated');
      fetchInitialData();
    }
  };

  const handleSaveAttendance = async () => {
    if (!selectedClass) return;
    const records = Object.entries(attendanceMarks).map(([studentId, status]) => ({
      studentId: parseInt(studentId),
      status
    }));
    const senderName = userRole === 'admin' ? 'Piyush (Owner)' : (teacherInfo?.name || 'Teacher');
    await apiFetch('/api/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ records, date: attendanceDate, senderName })
    });
    showNotification('Student attendance saved');
  };

  const handleSaveTeacherAttendance = async () => {
    const records = Object.entries(teacherAttendanceMarks).map(([teacherId, status]) => ({
      teacherId: parseInt(teacherId),
      status
    }));
    await apiFetch('/api/teacher-attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ records, date: attendanceDate })
    });
    showNotification('Teacher attendance saved');
  };

  const handleSaveHomework = async () => {
    if (!selectedClass) return;
    const records = Object.entries(homeworkMarks).map(([studentId, status]) => ({
      studentId: parseInt(studentId),
      status
    }));
    const senderName = userRole === 'admin' ? 'Piyush (Owner)' : (teacherInfo?.name || 'Teacher');
    await apiFetch('/api/homework', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ records, date: attendanceDate, senderName })
    });
    showNotification('Homework records saved');
  };

  const handleSaveTestMarks = async () => {
    if (!selectedClass || !testName.trim()) {
      showNotification('Please enter test name', 'error');
      return;
    }
    const records = Object.entries(testMarks).map(([studentId, marks]) => ({
      studentId: parseInt(studentId),
      marks
    }));
    const senderName = userRole === 'admin' ? 'Piyush (Owner)' : (teacherInfo?.name || 'Teacher');
    await apiFetch('/api/test-marks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ records, testName, date: attendanceDate, maxMarks, senderName })
    });
    showNotification('Test marks saved');
    setTestName('');
  };

  const fetchPerformanceSummary = async (studentId: number) => {
    const res = await apiFetch(`/api/performance/${studentId}?month=${performanceMonth}`);
    const data = await res.json();
    setPerformanceSummary(data);
  };

  const fetchDailyData = async () => {
    if (!dailyDataClassId) return;
    const [sRes, tRes] = await Promise.all([
      apiFetch(`/api/attendance?date=${dailyDataDate}&classId=${dailyDataClassId}`),
      apiFetch(`/api/teacher-attendance?date=${dailyDataDate}`)
    ]);
    setDailyStudentAttendance(await sRes.json());
    setDailyTeacherAttendance(await tRes.json());
  };

  const toggleAttendance = (studentId: number) => {
    setAttendanceMarks(prev => ({
      ...prev,
      [studentId]: prev[studentId] === 'present' ? 'absent' : 'present'
    }));
  };

  const SidebarItem = ({ icon: Icon, label, view }: { icon: any, label: string, view: View }) => (
    <button
      onClick={() => setCurrentView(view)}
      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
        currentView === view 
          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
          : 'text-slate-600 hover:bg-slate-100'
      }`}
    >
      <Icon size={20} />
      <span className="font-medium">{label}</span>
    </button>
  );

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 max-w-md w-full"
        >
          <div className="flex flex-col items-center mb-8">
            <div className="bg-indigo-600 p-4 rounded-2xl text-white mb-4 shadow-lg shadow-indigo-200">
              <CheckCircle2 size={32} />
            </div>
            <h1 className="text-3xl font-bold text-slate-900">ClassTrack</h1>
            <p className="text-slate-500 mt-2 text-center">Please enter your password to access the attendance system.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Username (Optional for Admin)</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  placeholder="admin or teacher_username"
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  required
                />
              </div>
              {loginError && <p className="text-rose-500 text-xs font-bold mt-2">{loginError}</p>}
            </div>
            <button 
              type="submit"
              className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
            >
              Login to Dashboard
            </button>
          </form>
          
          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400 font-medium tracking-wide">Authorized Personnel Only</p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">
      {/* Notifications */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-2xl shadow-2xl font-bold flex items-center gap-3 ${
              notification.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
            }`}
          >
            {notification.type === 'success' ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
            {notification.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 p-6 flex flex-col">
        <div className="flex items-center space-x-3 mb-10 px-2">
          <div className="bg-indigo-600 p-2 rounded-lg text-white">
            <CheckCircle2 size={24} />
          </div>
          <h1 className="text-xl font-bold tracking-tight">ClassTrack</h1>
        </div>

        <nav className="space-y-2 flex-1">
          <SidebarItem icon={LayoutDashboard} label="Dashboard" view="dashboard" />
          {userRole === 'admin' && (
            <SidebarItem icon={UsersRound} label="Teachers" view="teachers" />
          )}
          <SidebarItem icon={BookOpen} label="Classes & Students" view="classes" />
          <SidebarItem icon={Calendar} label="Student Attendance" view="attendance" />
          <SidebarItem icon={ClipboardList} label="Homework" view="homework" />
          <SidebarItem icon={Trophy} label="Test Marks" view="test-marks" />
          {userRole === 'admin' && (
            <SidebarItem icon={CheckCircle2} label="Teacher Attendance" view="teacher-attendance" />
          )}
          <SidebarItem icon={History} label="Daily Data" view="daily-data" />
          {userRole === 'admin' && (
            <SidebarItem icon={SettingsIcon} label="Settings" view="settings" />
          )}
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-100 space-y-4">
          {userRole === 'teacher' && teacherInfo && (
            <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
              <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Logged in as</p>
              <p className="text-sm font-bold text-indigo-900 truncate">{teacherInfo.name}</p>
              <p className="text-[10px] font-medium text-indigo-600 mt-0.5">Teacher Account</p>
            </div>
          )}
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-rose-600 font-bold hover:bg-rose-50 rounded-xl transition-colors"
          >
            <LogOut size={20} />
            Logout
          </button>
          <div className="bg-slate-50 rounded-xl p-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Status</p>
            <p className="text-sm font-medium text-slate-700">System Online</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <AnimatePresence mode="wait">
          {currentView === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <header>
                <h2 className="text-3xl font-bold text-slate-900">
                  {userRole === 'teacher' ? `Welcome, ${teacherInfo?.name}` : 'Dashboard Overview'}
                </h2>
                <p className="text-slate-500 mt-1">
                  {userRole === 'teacher' 
                    ? 'Manage your class attendance and view records.' 
                    : 'Welcome back to your attendance management system.'}
                </p>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                  <div className="bg-blue-50 w-12 h-12 rounded-xl flex items-center justify-center text-blue-600 mb-4">
                    <Users size={24} />
                  </div>
                  <p className="text-slate-500 font-medium">Total Teachers</p>
                  <h3 className="text-4xl font-bold mt-1">{stats.teachers}</h3>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                  <div className="bg-indigo-50 w-12 h-12 rounded-xl flex items-center justify-center text-indigo-600 mb-4">
                    <BookOpen size={24} />
                  </div>
                  <p className="text-slate-500 font-medium">Total Classes</p>
                  <h3 className="text-4xl font-bold mt-1">{stats.classes}</h3>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                  <div className="bg-emerald-50 w-12 h-12 rounded-xl flex items-center justify-center text-emerald-600 mb-4">
                    <GraduationCap size={24} />
                  </div>
                  <p className="text-slate-500 font-medium">Total Students</p>
                  <h3 className="text-4xl font-bold mt-1">{stats.students}</h3>
                </div>
              </div>

              <div className="bg-indigo-900 rounded-3xl p-8 text-white relative overflow-hidden">
                <div className="relative z-10">
                  <h3 className="text-2xl font-bold mb-2">Quick Attendance</h3>
                  <p className="text-indigo-200 mb-6 max-w-md">Ready to start today's roll call? Select a class and mark your students present or absent in seconds.</p>
                  <button 
                    onClick={() => setCurrentView('attendance')}
                    className="bg-white text-indigo-900 px-6 py-3 rounded-xl font-bold hover:bg-indigo-50 transition-colors"
                  >
                    Start Marking
                  </button>
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-800 rounded-full -mr-20 -mt-20 opacity-50 blur-3xl"></div>
              </div>
            </motion.div>
          )}

          {currentView === 'teachers' && (
            <motion.div
              key="teachers"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <header className="flex justify-between items-end">
                <div>
                  <h2 className="text-3xl font-bold text-slate-900">Teachers Management</h2>
                  <p className="text-slate-500 mt-1">Add or remove faculty members from the system.</p>
                </div>
              </header>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                      <UserPlus size={20} className="text-indigo-600" />
                      Add New Teacher
                    </h3>
                    <form onSubmit={handleAddTeacher} className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-600 mb-1">Full Name</label>
                        <input
                          type="text"
                          value={newTeacherName}
                          onChange={(e) => setNewTeacherName(e.target.value)}
                          placeholder="e.g. John Doe"
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                          type="text"
                          value={teacherDetails.phone}
                          onChange={(e) => setTeacherDetails({...teacherDetails, phone: e.target.value})}
                          placeholder="Phone Number"
                          className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                        <input
                          type="email"
                          value={teacherDetails.email}
                          onChange={(e) => setTeacherDetails({...teacherDetails, email: e.target.value})}
                          placeholder="Email Address"
                          className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                        <input
                          type="text"
                          value={teacherDetails.subject}
                          onChange={(e) => setTeacherDetails({...teacherDetails, subject: e.target.value})}
                          placeholder="Subject"
                          className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                        <input
                          type="text"
                          value={teacherDetails.qualification}
                          onChange={(e) => setTeacherDetails({...teacherDetails, qualification: e.target.value})}
                          placeholder="Qualification"
                          className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                        <input
                          type="text"
                          value={teacherDetails.experience}
                          onChange={(e) => setTeacherDetails({...teacherDetails, experience: e.target.value})}
                          placeholder="Experience"
                          className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                        <div className="md:col-span-2 border-t border-slate-100 pt-4 mt-2">
                          <p className="text-xs font-bold text-slate-400 uppercase mb-3">Login Credentials</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input
                              type="text"
                              value={teacherDetails.username}
                              onChange={(e) => setTeacherDetails({...teacherDetails, username: e.target.value})}
                              placeholder="Username"
                              className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                            <input
                              type="password"
                              value={teacherDetails.password}
                              onChange={(e) => setTeacherDetails({...teacherDetails, password: e.target.value})}
                              placeholder="Password"
                              className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                          </div>
                        </div>
                      </div>
                      <button className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2">
                        <Plus size={20} />
                        Add Teacher
                      </button>
                    </form>
                  </div>
                </div>

                <div className="lg:col-span-2">
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 border-bottom border-slate-100">
                        <tr>
                          <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">ID</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Name</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {teachers.map((teacher) => (
                          <tr key={teacher.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 text-sm text-slate-500 font-mono">#{teacher.id}</td>
                            <td className="px-6 py-4 text-sm font-semibold text-slate-700">
                              {teacher.name}
                              <div className="text-xs text-slate-400 font-mono mt-0.5">User: {teacher.username || 'N/A'}</div>
                            </td>
                            <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                              <button 
                                onClick={() => setViewingTeacher(teacher)}
                                className="text-indigo-500 hover:bg-indigo-50 p-2 rounded-lg transition-colors"
                                title="View Details"
                              >
                                <Info size={18} />
                              </button>
                              <button 
                                onClick={() => setEditingTeacher(teacher)}
                                className="text-amber-500 hover:bg-amber-50 p-2 rounded-lg transition-colors"
                                title="Edit Profile"
                              >
                                <Pencil size={18} />
                              </button>
                              <button 
                                onClick={() => handleDeleteTeacher(teacher.id)}
                                className="text-rose-500 hover:bg-rose-50 p-2 rounded-lg transition-colors"
                              >
                                <Trash2 size={18} />
                              </button>
                            </td>
                          </tr>
                        ))}
                        {teachers.length === 0 && (
                          <tr>
                            <td colSpan={3} className="px-6 py-10 text-center text-slate-400 italic">No teachers added yet.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {currentView === 'classes' && (
            <motion.div
              key="classes"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <header>
                <h2 className="text-3xl font-bold text-slate-900">Classes & Students</h2>
                <p className="text-slate-500 mt-1">Organize your students into classes for easier tracking.</p>
              </header>

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Classes List */}
                <div className="lg:col-span-1 space-y-4">
                  {userRole === 'admin' && (
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                      <h3 className="text-lg font-bold mb-4">Add Class</h3>
                      <form onSubmit={handleAddClass} className="flex gap-2">
                        <input
                          type="text"
                          value={newClassName}
                          onChange={(e) => setNewClassName(e.target.value)}
                          placeholder="Class Name"
                          className="flex-1 px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <button className="bg-indigo-600 text-white p-2 rounded-xl hover:bg-indigo-700">
                          <Plus size={20} />
                        </button>
                      </form>
                    </div>
                  )}

                  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-4 bg-slate-50 border-b border-slate-100">
                      <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Your Classes</h3>
                    </div>
                    <div className="divide-y divide-slate-100">
                      <button
                        onClick={() => {
                          setSelectedClass({ id: 0, name: 'All Students' });
                          fetchStudents(0);
                        }}
                        className={`w-full flex items-center justify-between px-6 py-4 text-left transition-colors ${
                          selectedClass?.id === 0 ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-50'
                        }`}
                      >
                        <span className="font-bold">Show All Students</span>
                        <ChevronRight size={16} className={selectedClass?.id === 0 ? 'text-indigo-400' : 'text-slate-300'} />
                      </button>
                      {classes.map((cls) => (
                        <button
                          key={cls.id}
                          onClick={() => {
                            setSelectedClass(cls);
                            fetchStudents(cls.id);
                          }}
                          className={`w-full flex items-center justify-between px-6 py-4 text-left transition-colors ${
                            selectedClass?.id === cls.id ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-50'
                          }`}
                        >
                          <span className="font-semibold">{cls.name}</span>
                          <div className="flex items-center gap-2">
                            {userRole === 'admin' && (
                              <Trash2 
                                size={16} 
                                className="text-slate-300 hover:text-rose-500 transition-colors" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteClass(cls.id);
                                }}
                              />
                            )}
                            <ChevronRight size={16} className={selectedClass?.id === cls.id ? 'text-indigo-400' : 'text-slate-300'} />
                          </div>
                        </button>
                      ))}
                      {classes.length === 0 && (
                        <div className="p-6 text-center text-slate-400 text-sm">No classes yet.</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Students List */}
                <div className="lg:col-span-3">
                  {selectedClass ? (
                    <div className="space-y-6">
                      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                          <h3 className="text-xl font-bold">Students in {selectedClass.name}</h3>
                          <div className="flex items-center gap-4 mt-1">
                            <p className="text-sm text-slate-500">{students.length} students enrolled</p>
                            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1 rounded-lg border border-slate-100">
                              <span className="text-xs font-bold text-slate-400 uppercase">Sort by:</span>
                              <button 
                                onClick={() => setStudentSortBy('name')}
                                className={`text-xs font-bold px-2 py-0.5 rounded ${studentSortBy === 'name' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-200'}`}
                              >
                                Name
                              </button>
                              <button 
                                onClick={() => setStudentSortBy('id')}
                                className={`text-xs font-bold px-2 py-0.5 rounded ${studentSortBy === 'id' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-200'}`}
                              >
                                ID
                              </button>
                              <button 
                                onClick={() => setStudentSortBy('class')}
                                className={`text-xs font-bold px-2 py-0.5 rounded ${studentSortBy === 'class' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-200'}`}
                              >
                                Class
                              </button>
                            </div>
                          </div>
                        </div>
                        <form onSubmit={handleAddStudent} className="space-y-4 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="text-sm font-bold text-slate-500 uppercase">Add New Student</h4>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="md:col-span-1">
                              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Full Name *</label>
                              <input
                                type="text"
                                value={newStudentName}
                                onChange={(e) => setNewStudentName(e.target.value)}
                                placeholder="Student Name"
                                className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Phone</label>
                              <input
                                type="text"
                                value={studentDetails.phone}
                                onChange={(e) => setStudentDetails({...studentDetails, phone: e.target.value})}
                                placeholder="Phone Number"
                                className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Father's Name</label>
                              <input
                                type="text"
                                value={studentDetails.fatherName}
                                onChange={(e) => setStudentDetails({...studentDetails, fatherName: e.target.value})}
                                placeholder="Father's Name"
                                className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Mother's Name</label>
                              <input
                                type="text"
                                value={studentDetails.motherName}
                                onChange={(e) => setStudentDetails({...studentDetails, motherName: e.target.value})}
                                placeholder="Mother's Name"
                                className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Brother's Name</label>
                              <input
                                type="text"
                                value={studentDetails.brotherName}
                                onChange={(e) => setStudentDetails({...studentDetails, brotherName: e.target.value})}
                                placeholder="Brother's Name"
                                className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Brother's Class</label>
                              <input
                                type="text"
                                value={studentDetails.brotherClass}
                                onChange={(e) => setStudentDetails({...studentDetails, brotherClass: e.target.value})}
                                placeholder="Brother's Class"
                                className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Sister's Name</label>
                              <input
                                type="text"
                                value={studentDetails.sisterName}
                                onChange={(e) => setStudentDetails({...studentDetails, sisterName: e.target.value})}
                                placeholder="Sister's Name"
                                className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Sister's Class</label>
                              <input
                                type="text"
                                value={studentDetails.sisterClass}
                                onChange={(e) => setStudentDetails({...studentDetails, sisterClass: e.target.value})}
                                placeholder="Sister's Class"
                                className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                              />
                            </div>
                          </div>
                          <button className="w-full bg-indigo-600 text-white px-4 py-3 rounded-xl font-bold hover:bg-indigo-700 flex items-center justify-center gap-2 transition-all shadow-sm">
                            <Plus size={18} /> Add Student to {selectedClass.name}
                          </button>
                        </form>
                      </div>

                      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <table className="w-full text-left">
                          <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Name</th>
                              {selectedClass.id === 0 && (
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Class</th>
                              )}
                              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {[...students]
                              .sort((a, b) => {
                                if (studentSortBy === 'name') return a.name.localeCompare(b.name);
                                if (studentSortBy === 'class') return (a.className || '').localeCompare(b.className || '');
                                return a.id - b.id;
                              })
                              .map((student) => (
                              <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 font-medium text-slate-700">
                                  <span className="text-xs font-mono text-slate-400 mr-2">#{student.id}</span>
                                  {student.name}
                                </td>
                                {selectedClass.id === 0 && (
                                  <td className="px-6 py-4 text-sm text-slate-500">{student.className}</td>
                                )}
                                <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                                  <button 
                                    onClick={() => setViewingStudent(student)}
                                    className="text-indigo-500 hover:bg-indigo-50 p-2 rounded-lg transition-colors"
                                    title="View Details"
                                  >
                                    <Info size={18} />
                                  </button>
                                  <button 
                                    onClick={() => setEditingStudent(student)}
                                    className="text-amber-500 hover:bg-amber-50 p-2 rounded-lg transition-colors"
                                    title="Edit Profile"
                                  >
                                    <Pencil size={18} />
                                  </button>
                                  {userRole === 'admin' && (
                                    <button 
                                      onClick={() => handleDeleteStudent(student.id)}
                                      className="text-rose-500 hover:bg-rose-50 p-2 rounded-lg transition-colors"
                                    >
                                      <Trash2 size={18} />
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))}
                            {students.length === 0 && (
                              <tr>
                                <td colSpan={2} className="px-6 py-10 text-center text-slate-400 italic">No students in this class yet.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center bg-white rounded-3xl border-2 border-dashed border-slate-200 p-12 text-center">
                      <div className="bg-slate-50 p-4 rounded-full mb-4">
                        <BookOpen size={48} className="text-slate-300" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-700">Select a Class</h3>
                      <p className="text-slate-500 max-w-xs mt-2">Choose a class from the left sidebar to manage its students.</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {currentView === 'teacher-attendance' && (
            <motion.div
              key="teacher-attendance"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-bold text-slate-900">Teacher Attendance</h2>
                  <p className="text-slate-500 mt-1">Record attendance for all teachers.</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-2xl shadow-sm border border-slate-100">
                  <Calendar size={18} className="text-slate-400" />
                  <input
                    type="date"
                    value={attendanceDate}
                    onChange={(e) => setAttendanceDate(e.target.value)}
                    className="bg-transparent outline-none text-sm font-semibold text-slate-700"
                  />
                </div>
              </header>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="text-lg font-bold">Faculty Attendance Sheet</h3>
                  <div className="flex gap-4 text-sm font-medium">
                    <span className="text-emerald-600">Present: {Object.values(teacherAttendanceMarks).filter(v => v === 'present').length}</span>
                    <span className="text-rose-600">Absent: {Object.values(teacherAttendanceMarks).filter(v => v === 'absent').length}</span>
                  </div>
                </div>
                <div className="divide-y divide-slate-100">
                  {teachers.map((teacher) => (
                    <div key={teacher.id} className="flex items-center justify-between px-8 py-4 hover:bg-slate-50 transition-colors">
                      <span className="font-semibold text-slate-700">{teacher.name}</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setTeacherAttendanceMarks(prev => ({ ...prev, [teacher.id]: 'present' }))}
                          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                            teacherAttendanceMarks[teacher.id] === 'present'
                              ? 'bg-emerald-100 text-emerald-700 ring-2 ring-emerald-500'
                              : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                          }`}
                        >
                          Present
                        </button>
                        <button
                          onClick={() => setTeacherAttendanceMarks(prev => ({ ...prev, [teacher.id]: 'absent' }))}
                          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                            teacherAttendanceMarks[teacher.id] === 'absent'
                              ? 'bg-rose-100 text-rose-700 ring-2 ring-rose-500'
                              : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                          }`}
                        >
                          Absent
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
                  <button
                    onClick={handleSaveTeacherAttendance}
                    className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                  >
                    Save Teacher Attendance
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {currentView === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6 max-w-2xl"
            >
              <header className="flex justify-between items-end">
                <div>
                  <h2 className="text-3xl font-bold text-slate-900">Settings</h2>
                  <p className="text-slate-500 mt-1">Manage your account security and preferences.</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Account</p>
                  <p className="text-sm font-bold text-indigo-600">Piyush (Owner)</p>
                </div>
              </header>

              <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <Lock size={20} className="text-indigo-600" />
                    Change Password
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">Only the owner can change the system password.</p>
                </div>
                <div className="p-8">
                  <form onSubmit={handleChangePassword} className="space-y-6">
                    <div className="grid grid-cols-1 gap-6">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Current Password</label>
                        <input
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="Enter current password"
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">New Password</label>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Enter new password"
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                          required
                        />
                      </div>
                    </div>

                    {settingsMessage.text && (
                      <div className={`p-4 rounded-xl text-sm font-bold ${
                        settingsMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                      }`}>
                        {settingsMessage.text}
                      </div>
                    )}

                    <button 
                      type="submit"
                      className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                    >
                      Update Password
                    </button>
                  </form>
                </div>
              </div>

              <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <MessageCircle size={20} className="text-emerald-600" />
                    WhatsApp Notifications
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">Configure automatic parent notifications.</p>
                </div>
                <div className="p-8 space-y-6">
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div>
                      <p className="font-bold text-slate-700">Enable Notifications</p>
                      <p className="text-xs text-slate-500">Automatically notify parents on attendance, homework, and marks.</p>
                    </div>
                    <button 
                      onClick={async () => {
                        const newVal = !whatsappEnabled;
                        setWhatsappEnabled(newVal);
                        await apiFetch('/api/settings', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ settings: { whatsapp_enabled: newVal.toString() } })
                        });
                        showNotification(`WhatsApp notifications ${newVal ? 'enabled' : 'disabled'}`);
                      }}
                      className={`w-12 h-6 rounded-full transition-colors relative ${whatsappEnabled ? 'bg-emerald-500' : 'bg-slate-300'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${whatsappEnabled ? 'left-7' : 'left-1'}`}></div>
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Sender WhatsApp Number</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={whatsappSenderNumber}
                        onChange={(e) => setWhatsappSenderNumber(e.target.value)}
                        placeholder="+1234567890"
                        className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      />
                      <button 
                        onClick={async () => {
                          await apiFetch('/api/settings', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ settings: { whatsapp_sender_number: whatsappSenderNumber } })
                          });
                          showNotification('Sender number updated');
                        }}
                        className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-700 transition-all"
                      >
                        Save
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-2 italic">Note: This number is used for reference in messages. Real automated sending requires a configured API provider.</p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-100 p-6 rounded-3xl border border-slate-200">
                <h4 className="font-bold text-slate-700 mb-2">Security Note</h4>
                <p className="text-sm text-slate-500">Changing the password will affect all future logins. Please ensure you remember your new password as it cannot be recovered without database access.</p>
              </div>
            </motion.div>
          )}

          {currentView === 'daily-data' && (
            <motion.div
              key="daily-data"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-bold text-slate-900">Daily Attendance Data</h2>
                  <p className="text-slate-500 mt-1">View historical attendance records.</p>
                </div>
                <div className="flex items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
                  <input
                    type="date"
                    value={dailyDataDate}
                    onChange={(e) => setDailyDataDate(e.target.value)}
                    className="px-3 py-2 bg-slate-50 rounded-xl border border-slate-100 text-sm font-semibold outline-none"
                  />
                  <select
                    className="px-4 py-2 bg-slate-50 rounded-xl border border-slate-100 text-sm font-semibold outline-none"
                    onChange={(e) => setDailyDataClassId(e.target.value)}
                    value={dailyDataClassId}
                  >
                    <option value="">Select Class</option>
                    {classes.map(cls => (
                      <option key={cls.id} value={cls.id}>{cls.name}</option>
                    ))}
                  </select>
                  <button
                    onClick={fetchDailyData}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-indigo-700"
                  >
                    View Data
                  </button>
                </div>
              </header>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                  <div className="p-6 border-b border-slate-100 bg-slate-50">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      <GraduationCap size={20} className="text-indigo-600" />
                      Student Attendance
                    </h3>
                  </div>
                  <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
                    {dailyStudentAttendance.map((a: any) => (
                      <div key={a.id} className="px-6 py-4 flex justify-between items-center">
                        <span className="font-medium text-slate-700">{a.student_name}</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                          a.status === 'present' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                        }`}>
                          {a.status}
                        </span>
                      </div>
                    ))}
                    {dailyStudentAttendance.length === 0 && (
                      <div className="p-12 text-center text-slate-400">No student records for this date/class.</div>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                  <div className="p-6 border-b border-slate-100 bg-slate-50">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      <Users size={20} className="text-indigo-600" />
                      Teacher Attendance
                    </h3>
                  </div>
                  <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
                    {dailyTeacherAttendance.map((a: any) => (
                      <div key={a.id} className="px-6 py-4 flex justify-between items-center">
                        <span className="font-medium text-slate-700">{a.teacher_name}</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                          a.status === 'present' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                        }`}>
                          {a.status}
                        </span>
                      </div>
                    ))}
                    {dailyTeacherAttendance.length === 0 && (
                      <div className="p-12 text-center text-slate-400">No teacher records for this date.</div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          {currentView === 'homework' && (
            <motion.div
              key="homework"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-bold text-slate-900">Homework Tracking</h2>
                  <p className="text-slate-500 mt-1">Record homework status for students.</p>
                </div>
                <div className="flex items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
                  <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-100">
                    <Calendar size={18} className="text-slate-400" />
                    <input
                      type="date"
                      value={attendanceDate}
                      onChange={(e) => setAttendanceDate(e.target.value)}
                      className="bg-transparent outline-none text-sm font-semibold text-slate-700"
                    />
                  </div>
                  <select
                    className="px-4 py-2 bg-slate-50 rounded-xl border border-slate-100 text-sm font-semibold text-slate-700 outline-none"
                    onChange={(e) => {
                      const cls = classes.find(c => c.id === parseInt(e.target.value));
                      if (cls) {
                        setSelectedClass(cls);
                        fetchStudents(cls.id);
                      }
                    }}
                    value={selectedClass?.id || ''}
                  >
                    <option value="" disabled>Select Class</option>
                    {classes.map(cls => (
                      <option key={cls.id} value={cls.id}>{cls.name}</option>
                    ))}
                  </select>
                </div>
              </header>

              {selectedClass ? (
                <div className="space-y-6">
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                      <h3 className="text-lg font-bold">Homework Sheet: {selectedClass.name}</h3>
                      <div className="flex gap-4 text-sm font-medium">
                        <span className="text-emerald-600">Well Done: {Object.values(homeworkMarks).filter(v => v === 'well done').length}</span>
                        <span className="text-indigo-600">Done: {Object.values(homeworkMarks).filter(v => v === 'done').length}</span>
                        <span className="text-rose-600">Not Done: {Object.values(homeworkMarks).filter(v => v === 'not done').length}</span>
                      </div>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {students.map((student) => (
                        <div key={student.id} className="flex items-center justify-between px-8 py-4 hover:bg-slate-50 transition-colors">
                          <span className="font-semibold text-slate-700">{student.name}</span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setHomeworkMarks(prev => ({ ...prev, [student.id]: 'well done' }))}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                homeworkMarks[student.id] === 'well done'
                                  ? 'bg-emerald-100 text-emerald-700 ring-2 ring-emerald-500'
                                  : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                              }`}
                            >
                              Well Done
                            </button>
                            <button
                              onClick={() => setHomeworkMarks(prev => ({ ...prev, [student.id]: 'done' }))}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                homeworkMarks[student.id] === 'done'
                                  ? 'bg-indigo-100 text-indigo-700 ring-2 ring-indigo-500'
                                  : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                              }`}
                            >
                              Done
                            </button>
                            <button
                              onClick={() => setHomeworkMarks(prev => ({ ...prev, [student.id]: 'not done' }))}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                homeworkMarks[student.id] === 'not done'
                                  ? 'bg-rose-100 text-rose-700 ring-2 ring-rose-500'
                                  : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                              }`}
                            >
                              Not Done
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
                      <button
                        onClick={handleSaveHomework}
                        className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                      >
                        Save Homework Records
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-96 flex flex-col items-center justify-center bg-white rounded-3xl border-2 border-dashed border-slate-200 p-12 text-center">
                  <div className="bg-slate-50 p-4 rounded-full mb-4">
                    <ClipboardList size={48} className="text-slate-300" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-700">Select a Class</h3>
                  <p className="text-slate-500 max-w-xs mt-2">Choose a class to start marking homework status.</p>
                </div>
              )}
            </motion.div>
          )}

          {currentView === 'test-marks' && (
            <motion.div
              key="test-marks"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-bold text-slate-900">Test Marks</h2>
                  <p className="text-slate-500 mt-1">Record marks for class tests.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
                  <input
                    type="text"
                    placeholder="Test Name (e.g. Unit Test 1)"
                    value={testName}
                    onChange={(e) => setTestName(e.target.value)}
                    className="px-4 py-2 bg-slate-50 rounded-xl border border-slate-100 text-sm font-semibold outline-none"
                  />
                  <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-xs font-bold text-slate-400">Max Marks:</span>
                    <input
                      type="number"
                      value={maxMarks}
                      onChange={(e) => setMaxMarks(parseInt(e.target.value))}
                      className="w-16 bg-transparent outline-none text-sm font-semibold text-slate-700"
                    />
                  </div>
                  <select
                    className="px-4 py-2 bg-slate-50 rounded-xl border border-slate-100 text-sm font-semibold text-slate-700 outline-none"
                    onChange={(e) => {
                      const cls = classes.find(c => c.id === parseInt(e.target.value));
                      if (cls) {
                        setSelectedClass(cls);
                        fetchStudents(cls.id);
                      }
                    }}
                    value={selectedClass?.id || ''}
                  >
                    <option value="" disabled>Select Class</option>
                    {classes.map(cls => (
                      <option key={cls.id} value={cls.id}>{cls.name}</option>
                    ))}
                  </select>
                </div>
              </header>

              {selectedClass ? (
                <div className="space-y-6">
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-6 border-b border-slate-100">
                      <h3 className="text-lg font-bold">Marks Entry: {selectedClass.name}</h3>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {students.map((student) => (
                        <div key={student.id} className="flex items-center justify-between px-8 py-4 hover:bg-slate-50 transition-colors">
                          <span className="font-semibold text-slate-700">{student.name}</span>
                          <div className="flex items-center gap-3">
                            <input
                              type="number"
                              min="0"
                              max={maxMarks}
                              value={testMarks[student.id] || 0}
                              onChange={(e) => setTestMarks(prev => ({ ...prev, [student.id]: parseInt(e.target.value) }))}
                              className="w-20 px-3 py-2 rounded-xl border border-slate-200 text-center font-bold text-indigo-600 outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <span className="text-slate-400 font-bold">/ {maxMarks}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
                      <button
                        onClick={handleSaveTestMarks}
                        className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                      >
                        Save Test Marks
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-96 flex flex-col items-center justify-center bg-white rounded-3xl border-2 border-dashed border-slate-200 p-12 text-center">
                  <div className="bg-slate-50 p-4 rounded-full mb-4">
                    <Trophy size={48} className="text-slate-300" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-700">Select a Class</h3>
                  <p className="text-slate-500 max-w-xs mt-2">Choose a class to start entering test marks.</p>
                </div>
              )}
            </motion.div>
          )}

          {currentView === 'attendance' && (
            <motion.div
              key="attendance"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-bold text-slate-900">Mark Attendance</h2>
                  <p className="text-slate-500 mt-1">Select a class and date to record attendance.</p>
                </div>
                <div className="flex items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
                  <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-100">
                    <Calendar size={18} className="text-slate-400" />
                    <input
                      type="date"
                      value={attendanceDate}
                      onChange={(e) => setAttendanceDate(e.target.value)}
                      className="bg-transparent outline-none text-sm font-semibold text-slate-700"
                    />
                  </div>
                  <select
                    className="px-4 py-2 bg-slate-50 rounded-xl border border-slate-100 text-sm font-semibold text-slate-700 outline-none"
                    onChange={(e) => {
                      const cls = classes.find(c => c.id === parseInt(e.target.value));
                      if (cls) {
                        setSelectedClass(cls);
                        fetchStudents(cls.id);
                      }
                    }}
                    value={selectedClass?.id || ''}
                  >
                    <option value="" disabled>Select Class</option>
                    {classes.map(cls => (
                      <option key={cls.id} value={cls.id}>{cls.name}</option>
                    ))}
                  </select>
                </div>
              </header>

              {selectedClass ? (
                <div className="space-y-6">
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                      <h3 className="text-lg font-bold">Attendance Sheet: {selectedClass.name}</h3>
                      <div className="flex gap-4 text-sm font-medium">
                        <span className="flex items-center gap-1.5 text-emerald-600">
                          <div className="w-2 h-2 rounded-full bg-emerald-600"></div>
                          Present: {Object.values(attendanceMarks).filter(v => v === 'present').length}
                        </span>
                        <span className="flex items-center gap-1.5 text-rose-600">
                          <div className="w-2 h-2 rounded-full bg-rose-600"></div>
                          Absent: {Object.values(attendanceMarks).filter(v => v === 'absent').length}
                        </span>
                      </div>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {students.map((student) => (
                        <div key={student.id} className="flex items-center justify-between px-8 py-4 hover:bg-slate-50 transition-colors">
                          <span className="font-semibold text-slate-700">{student.name}</span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setAttendanceMarks(prev => ({ ...prev, [student.id]: 'present' }))}
                              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                                attendanceMarks[student.id] === 'present'
                                  ? 'bg-emerald-100 text-emerald-700 ring-2 ring-emerald-500'
                                  : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                              }`}
                            >
                              Present
                            </button>
                            <button
                              onClick={() => setAttendanceMarks(prev => ({ ...prev, [student.id]: 'absent' }))}
                              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                                attendanceMarks[student.id] === 'absent'
                                  ? 'bg-rose-100 text-rose-700 ring-2 ring-rose-500'
                                  : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                              }`}
                            >
                              Absent
                            </button>
                          </div>
                        </div>
                      ))}
                      {students.length === 0 && (
                        <div className="p-12 text-center text-slate-400 italic">No students in this class to mark.</div>
                      )}
                    </div>
                    <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
                      <button
                        onClick={handleSaveAttendance}
                        disabled={students.length === 0}
                        className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:shadow-none"
                      >
                        Save Attendance
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-96 flex flex-col items-center justify-center bg-white rounded-3xl border-2 border-dashed border-slate-200 p-12 text-center">
                  <div className="bg-slate-50 p-4 rounded-full mb-4">
                    <Calendar size={48} className="text-slate-300" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-700">Ready to Mark Attendance?</h3>
                  <p className="text-slate-500 max-w-xs mt-2">Select a class from the dropdown above to start recording today's attendance.</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Teacher Details Modal */}
        <AnimatePresence>
          {viewingTeacher && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setViewingTeacher(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="bg-indigo-600 p-6 text-white flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-2 rounded-xl">
                      <UsersRound size={24} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold">{viewingTeacher.name}</h3>
                      <p className="text-indigo-100 text-sm">Teacher Profile Details</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setViewingTeacher(null)}
                    className="bg-white/10 hover:bg-white/20 p-2 rounded-xl transition-colors"
                  >
                    <XCircle size={24} />
                  </button>
                </div>
                
                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Phone size={14} /> Contact Information
                      </h4>
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-slate-700 flex items-center gap-2">
                          <span className="text-slate-400">Phone:</span> {viewingTeacher.phone || 'N/A'}
                        </p>
                        <p className="text-sm font-medium text-slate-700 flex items-center gap-2">
                          <span className="text-slate-400">Email:</span> {viewingTeacher.email || 'N/A'}
                        </p>
                        <p className="text-sm font-medium text-slate-700 flex items-center gap-2">
                          <span className="text-slate-400">Username:</span> <span className="font-mono text-indigo-600">{viewingTeacher.username || 'N/A'}</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <BookOpen size={14} /> Professional Details
                      </h4>
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-slate-700 flex items-center gap-2">
                          <span className="text-slate-400">Subject:</span> {viewingTeacher.subject || 'N/A'}
                        </p>
                        <p className="text-sm font-medium text-slate-700 flex items-center gap-2">
                          <span className="text-slate-400">Qualification:</span> {viewingTeacher.qualification || 'N/A'}
                        </p>
                        <p className="text-sm font-medium text-slate-700 flex items-center gap-2">
                          <span className="text-slate-400">Experience:</span> {viewingTeacher.experience || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
                  <button 
                    onClick={() => setViewingTeacher(null)}
                    className="px-6 py-2 bg-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-300 transition-colors"
                  >
                    Close Profile
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Student Details Modal */}
        <AnimatePresence>
          {viewingStudent && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setViewingStudent(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="bg-indigo-600 p-6 text-white flex justify-between items-center shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-2 rounded-xl">
                      <User size={24} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold">{viewingStudent.name}</h3>
                      <p className="text-indigo-100 text-sm">Student Profile & Performance</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setViewingStudent(null)}
                    className="bg-white/10 hover:bg-white/20 p-2 rounded-xl transition-colors"
                  >
                    <XCircle size={24} />
                  </button>
                </div>
                
                <div className="overflow-y-auto p-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                          <Phone size={14} /> Contact Information
                        </h4>
                        <p className="text-lg font-semibold text-slate-700">{viewingStudent.phone || 'Not provided'}</p>
                      </div>
                      
                      <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                          <Heart size={14} /> Parents
                        </h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Father:</span>
                            <span className="font-semibold text-slate-700">{viewingStudent.fatherName || '-'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Mother:</span>
                            <span className="font-semibold text-slate-700">{viewingStudent.motherName || '-'}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                          <Users2 size={14} /> Siblings
                        </h4>
                        <div className="space-y-4">
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <p className="text-xs text-slate-400 font-bold uppercase mb-1">Brother</p>
                            <p className="font-semibold text-slate-700">{viewingStudent.brotherName || 'None'}</p>
                            {viewingStudent.brotherClass && (
                              <p className="text-xs text-indigo-600 font-medium">Class: {viewingStudent.brotherClass}</p>
                            )}
                          </div>
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <p className="text-xs text-slate-400 font-bold uppercase mb-1">Sister</p>
                            <p className="font-semibold text-slate-700">{viewingStudent.sisterName || 'None'}</p>
                            {viewingStudent.sisterClass && (
                              <p className="text-xs text-indigo-600 font-medium">Class: {viewingStudent.sisterClass}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-8">
                    <div className="flex items-center justify-between mb-6">
                      <h4 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <BarChart3 size={20} className="text-indigo-600" />
                        Monthly Performance Summary
                      </h4>
                      <input 
                        type="month" 
                        value={performanceMonth}
                        onChange={(e) => setPerformanceMonth(e.target.value)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    {performanceSummary ? (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-100">
                          <h5 className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-3">Attendance</h5>
                          <div className="space-y-2">
                            {performanceSummary.attendance.map(a => (
                              <div key={a.status} className="flex justify-between items-center">
                                <span className="text-sm text-slate-600 capitalize">{a.status}:</span>
                                <span className="font-bold text-emerald-700">{a.count}</span>
                              </div>
                            ))}
                            {performanceSummary.attendance.length === 0 && <p className="text-xs text-slate-400 italic">No records</p>}
                          </div>
                        </div>

                        <div className="bg-indigo-50 p-5 rounded-2xl border border-indigo-100">
                          <h5 className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-3">Homework</h5>
                          <div className="space-y-2">
                            {performanceSummary.homework.map(h => (
                              <div key={h.status} className="flex justify-between items-center">
                                <span className="text-sm text-slate-600 capitalize">{h.status}:</span>
                                <span className="font-bold text-indigo-700">{h.count}</span>
                              </div>
                            ))}
                            {performanceSummary.homework.length === 0 && <p className="text-xs text-slate-400 italic">No records</p>}
                          </div>
                        </div>

                        <div className="bg-amber-50 p-5 rounded-2xl border border-amber-100">
                          <h5 className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-3">Test Marks</h5>
                          <div className="space-y-3">
                            {performanceSummary.tests.map((t, idx) => (
                              <div key={idx} className="border-b border-amber-200/50 pb-2 last:border-0 last:pb-0">
                                <div className="flex justify-between items-center mb-1">
                                  <span className="text-xs font-bold text-slate-700 truncate mr-2">{t.test_name}</span>
                                  <span className="text-xs text-slate-400">{t.date}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <div className="w-full bg-amber-200 rounded-full h-1.5 mr-2">
                                    <div 
                                      className="bg-amber-600 h-1.5 rounded-full" 
                                      style={{ width: `${(t.marks / t.max_marks) * 100}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-xs font-bold text-amber-700 whitespace-nowrap">{t.marks}/{t.max_marks}</span>
                                </div>
                              </div>
                            ))}
                            {performanceSummary.tests.length === 0 && <p className="text-xs text-slate-400 italic">No records</p>}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center p-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end shrink-0">
                  <button 
                    onClick={() => setViewingStudent(null)}
                    className="px-6 py-2 bg-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-300 transition-colors"
                  >
                    Close Profile
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Edit Teacher Modal */}
        <AnimatePresence>
          {editingTeacher && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setEditingTeacher(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="bg-amber-600 p-6 text-white flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <Pencil size={24} />
                    <h3 className="text-2xl font-bold">Edit Teacher Profile</h3>
                  </div>
                  <button onClick={() => setEditingTeacher(null)}><XCircle size={24} /></button>
                </div>
                <form onSubmit={handleUpdateTeacher} className="p-8 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Name</label>
                      <input
                        type="text"
                        value={editingTeacher.name}
                        onChange={(e) => setEditingTeacher({...editingTeacher, name: e.target.value})}
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-amber-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Phone</label>
                      <input
                        type="text"
                        value={editingTeacher.phone || ''}
                        onChange={(e) => setEditingTeacher({...editingTeacher, phone: e.target.value})}
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Email</label>
                      <input
                        type="email"
                        value={editingTeacher.email || ''}
                        onChange={(e) => setEditingTeacher({...editingTeacher, email: e.target.value})}
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Subject</label>
                      <input
                        type="text"
                        value={editingTeacher.subject || ''}
                        onChange={(e) => setEditingTeacher({...editingTeacher, subject: e.target.value})}
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Username</label>
                      <input
                        type="text"
                        value={editingTeacher.username || ''}
                        onChange={(e) => setEditingTeacher({...editingTeacher, username: e.target.value})}
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">New Password (leave blank to keep current)</label>
                      <input
                        type="password"
                        value={editingTeacher.password || ''}
                        onChange={(e) => setEditingTeacher({...editingTeacher, password: e.target.value})}
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-amber-500"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <button type="button" onClick={() => setEditingTeacher(null)} className="px-6 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold">Cancel</button>
                    <button type="submit" className="px-6 py-2 bg-amber-600 text-white rounded-xl font-bold hover:bg-amber-700 transition-colors">Save Changes</button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Edit Student Modal */}
        <AnimatePresence>
          {editingStudent && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setEditingStudent(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="bg-amber-600 p-6 text-white flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <Pencil size={24} />
                    <h3 className="text-2xl font-bold">Edit Student Profile</h3>
                  </div>
                  <button onClick={() => setEditingStudent(null)}><XCircle size={24} /></button>
                </div>
                <form onSubmit={handleUpdateStudent} className="p-8 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Name</label>
                      <input
                        type="text"
                        value={editingStudent.name}
                        onChange={(e) => setEditingStudent({...editingStudent, name: e.target.value})}
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-amber-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Phone</label>
                      <input
                        type="text"
                        value={editingStudent.phone || ''}
                        onChange={(e) => setEditingStudent({...editingStudent, phone: e.target.value})}
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Father's Name</label>
                      <input
                        type="text"
                        value={editingStudent.fatherName || ''}
                        onChange={(e) => setEditingStudent({...editingStudent, fatherName: e.target.value})}
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Mother's Name</label>
                      <input
                        type="text"
                        value={editingStudent.motherName || ''}
                        onChange={(e) => setEditingStudent({...editingStudent, motherName: e.target.value})}
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Brother's Name</label>
                      <input
                        type="text"
                        value={editingStudent.brotherName || ''}
                        onChange={(e) => setEditingStudent({...editingStudent, brotherName: e.target.value})}
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Brother's Class</label>
                      <input
                        type="text"
                        value={editingStudent.brotherClass || ''}
                        onChange={(e) => setEditingStudent({...editingStudent, brotherClass: e.target.value})}
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Sister's Name</label>
                      <input
                        type="text"
                        value={editingStudent.sisterName || ''}
                        onChange={(e) => setEditingStudent({...editingStudent, sisterName: e.target.value})}
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Sister's Class</label>
                      <input
                        type="text"
                        value={editingStudent.sisterClass || ''}
                        onChange={(e) => setEditingStudent({...editingStudent, sisterClass: e.target.value})}
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <button type="button" onClick={() => setEditingStudent(null)} className="px-6 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold">Cancel</button>
                    <button type="submit" className="px-6 py-2 bg-amber-600 text-white rounded-xl font-bold hover:bg-amber-700 transition-colors">Save Changes</button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
