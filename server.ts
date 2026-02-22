import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("attendance.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );

  CREATE TABLE IF NOT EXISTS teachers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    subject TEXT,
    qualification TEXT,
    experience TEXT,
    username TEXT UNIQUE,
    password TEXT
  );

  CREATE TABLE IF NOT EXISTS classes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
  );

  CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    class_id INTEGER NOT NULL,
    phone TEXT,
    father_name TEXT,
    mother_name TEXT,
    brother_name TEXT,
    brother_class TEXT,
    sister_name TEXT,
    sister_class TEXT,
    FOREIGN KEY (class_id) REFERENCES classes (id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    status TEXT CHECK(status IN ('present', 'absent')) NOT NULL,
    UNIQUE(student_id, date),
    FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS teacher_attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    teacher_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    status TEXT CHECK(status IN ('present', 'absent')) NOT NULL,
    UNIQUE(teacher_id, date),
    FOREIGN KEY (teacher_id) REFERENCES teachers (id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS homework (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    status TEXT CHECK(status IN ('done', 'not done', 'well done')) NOT NULL,
    UNIQUE(student_id, date),
    FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS test_marks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    test_name TEXT NOT NULL,
    date TEXT NOT NULL,
    marks INTEGER NOT NULL,
    max_marks INTEGER NOT NULL,
    FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE
  );
`);

// Migration: Ensure columns exist for existing databases
const tables = {
  students: ['phone', 'father_name', 'mother_name', 'brother_name', 'brother_class', 'sister_name', 'sister_class'],
  teachers: ['phone', 'email', 'subject', 'qualification', 'experience', 'username', 'password']
};

for (const [table, columns] of Object.entries(tables)) {
  const info = db.prepare(`PRAGMA table_info(${table})`).all();
  const existingColumns = info.map((col: any) => col.name);
  for (const col of columns) {
    if (!existingColumns.includes(col)) {
      try {
        db.prepare(`ALTER TABLE ${table} ADD COLUMN ${col} TEXT`).run();
      } catch (e) {
        console.error(`Error adding column ${col} to ${table}:`, e);
      }
    }
  }
}

// Initialize default credentials if not set
const existingPassword = db.prepare("SELECT value FROM settings WHERE key = 'password'").get();
const existingUsername = db.prepare("SELECT value FROM settings WHERE key = 'username'").get();

if (!existingPassword) {
  const hashedPassword = bcrypt.hashSync("sky59piyish", 10);
  db.prepare("INSERT INTO settings (key, value) VALUES ('password', ?)").run(hashedPassword);
} else {
  // Update to requested password if it was default
  const isDefault = bcrypt.compareSync("admin123", existingPassword.value);
  if (isDefault) {
    const hashedPassword = bcrypt.hashSync("sky59piyish", 10);
    db.prepare("UPDATE settings SET value = ? WHERE key = 'password'").run(hashedPassword);
  }
}

if (!existingUsername) {
  db.prepare("INSERT INTO settings (key, value) VALUES ('username', 'Piyush')").run();
} else if (existingUsername.value === 'admin') {
  // Update to requested username if it was default
  db.prepare("UPDATE settings SET value = 'Piyush' WHERE key = 'username'").run();
}

// Initialize specific teacher if not exists
const teacherAnshu = db.prepare("SELECT * FROM teachers WHERE username = 'Anshu'").get();
if (!teacherAnshu) {
  const hashedTeacherPassword = bcrypt.hashSync("Anshu@100", 10);
  db.prepare(`
    INSERT INTO teachers (name, username, password, subject) 
    VALUES ('Anshu', 'Anshu', ?, 'General')
  `).run(hashedTeacherPassword);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Auth Middleware
  const authMiddleware = (req: any, res: any, next: any) => {
    const publicRoutes = ['/api/login', '/api/health'];
    if (publicRoutes.includes(req.path) || process.env.NODE_ENV !== 'production') {
      return next();
    }
    
    const token = req.headers['x-auth-token'];
    if (token === 'authenticated' || token === 'teacher-auth') {
      next();
    } else {
      res.status(401).json({ error: 'Unauthorized' });
    }
  };

  // Apply auth middleware to all /api routes except login
  app.use('/api', authMiddleware);

  // API Routes
  
  // Auth
  app.post("/api/login", (req, res) => {
    const { username, password } = req.body;
    
    // Check if it's the owner/admin login
    const storedAdminUsername = db.prepare("SELECT value FROM settings WHERE key = 'username'").get();
    const storedAdminPassword = db.prepare("SELECT value FROM settings WHERE key = 'password'").get();

    if (username === storedAdminUsername.value) {
      if (bcrypt.compareSync(password, storedAdminPassword.value)) {
        return res.json({ success: true, token: 'authenticated', role: 'admin' });
      }
    }

    // Check if it's a teacher login
    const teacher = db.prepare("SELECT * FROM teachers WHERE username = ?").get(username);
    if (teacher && teacher.password && bcrypt.compareSync(password, teacher.password)) {
      return res.json({ 
        success: true, 
        token: 'teacher-auth', 
        role: 'teacher',
        teacherId: teacher.id,
        teacherName: teacher.name
      });
    }

    res.status(401).json({ error: "Invalid credentials" });
  });

  app.post("/api/change-password", (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const storedPassword = db.prepare("SELECT value FROM settings WHERE key = 'password'").get();
    
    if (bcrypt.compareSync(currentPassword, storedPassword.value)) {
      const hashedPassword = bcrypt.hashSync(newPassword, 10);
      db.prepare("UPDATE settings SET value = ? WHERE key = 'password'").run(hashedPassword);
      res.json({ success: true });
    } else {
      res.status(401).json({ error: "Invalid current password" });
    }
  });

  // Teachers
  app.get("/api/teachers", (req, res) => {
    const teachers = db.prepare("SELECT * FROM teachers ORDER BY name").all();
    res.json(teachers);
  });

  app.post("/api/teachers", (req, res) => {
    const { name, phone, email, subject, qualification, experience, username, password } = req.body;
    const hashedPassword = password ? bcrypt.hashSync(password, 10) : null;
    try {
      const info = db.prepare(`
        INSERT INTO teachers (name, phone, email, subject, qualification, experience, username, password) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(name, phone, email, subject, qualification, experience, username, hashedPassword);
      res.json({ id: info.lastInsertRowid, ...req.body, password: password ? '******' : null });
    } catch (e) {
      res.status(400).json({ error: "Username already exists" });
    }
  });

  app.put("/api/teachers/:id", (req, res) => {
    const { name, phone, email, subject, qualification, experience, username, password } = req.body;
    const teacherId = req.params.id;
    
    let query = `
      UPDATE teachers 
      SET name = ?, phone = ?, email = ?, subject = ?, qualification = ?, experience = ?, username = ?
    `;
    const params = [name, phone, email, subject, qualification, experience, username];

    if (password) {
      query += `, password = ?`;
      params.push(bcrypt.hashSync(password, 10));
    }

    query += ` WHERE id = ?`;
    params.push(teacherId);

    try {
      db.prepare(query).run(...params);
      res.json({ success: true });
    } catch (e) {
      res.status(400).json({ error: "Username already exists" });
    }
  });

  app.delete("/api/teachers/:id", (req, res) => {
    db.prepare("DELETE FROM teachers WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Classes
  app.get("/api/classes", (req, res) => {
    const classes = db.prepare("SELECT * FROM classes ORDER BY name").all();
    res.json(classes);
  });

  app.post("/api/classes", (req, res) => {
    const { name } = req.body;
    try {
      const info = db.prepare("INSERT INTO classes (name) VALUES (?)").run(name);
      res.json({ id: info.lastInsertRowid, name });
    } catch (e) {
      res.status(400).json({ error: "Class already exists" });
    }
  });

  app.delete("/api/classes/:id", (req, res) => {
    db.prepare("DELETE FROM classes WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Students
  app.get("/api/students", (req, res) => {
    const { classId } = req.query;
    let students;
    if (classId) {
      students = db.prepare(`
        SELECT s.*, c.name as class_name 
        FROM students s 
        JOIN classes c ON s.class_id = c.id 
        WHERE s.class_id = ? 
        ORDER BY s.name
      `).all(classId);
    } else {
      students = db.prepare(`
        SELECT s.*, c.name as class_name 
        FROM students s 
        JOIN classes c ON s.class_id = c.id 
        ORDER BY s.name
      `).all();
    }
    
    // Map snake_case to camelCase
    const mappedStudents = students.map((s: any) => ({
      id: s.id,
      name: s.name,
      classId: s.class_id,
      className: s.class_name,
      phone: s.phone,
      fatherName: s.father_name,
      motherName: s.mother_name,
      brotherName: s.brother_name,
      brotherClass: s.brother_class,
      sisterName: s.sister_name,
      sisterClass: s.sister_class
    }));
    
    res.json(mappedStudents);
  });

  app.post("/api/students", (req, res) => {
    const { 
      name, classId, phone, fatherName, motherName, 
      brotherName, brotherClass, sisterName, sisterClass 
    } = req.body;
    const info = db.prepare(`
      INSERT INTO students (
        name, class_id, phone, father_name, mother_name, 
        brother_name, brother_class, sister_name, sister_class
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      name, classId, phone, fatherName, motherName, 
      brotherName, brotherClass, sisterName, sisterClass
    );
    res.json({ id: info.lastInsertRowid, ...req.body });
  });

  app.put("/api/students/:id", (req, res) => {
    const { name, phone, fatherName, motherName, brotherName, brotherClass, sisterName, sisterClass } = req.body;
    const studentId = req.params.id;
    
    try {
      db.prepare(`
        UPDATE students 
        SET name = ?, phone = ?, father_name = ?, mother_name = ?, 
            brother_name = ?, brother_class = ?, sister_name = ?, sister_class = ?
        WHERE id = ?
      `).run(
        name, phone, fatherName, motherName, 
        brotherName, brotherClass, sisterName, sisterClass, 
        studentId
      );
      res.json({ success: true });
    } catch (e) {
      res.status(400).json({ error: "Error updating student" });
    }
  });

  app.delete("/api/students/:id", (req, res) => {
    db.prepare("DELETE FROM students WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // WhatsApp Notification Helper
  const sendWhatsAppNotification = async (to: string, message: string) => {
    const enabled = db.prepare("SELECT value FROM settings WHERE key = 'whatsapp_enabled'").get() as any;
    if (!enabled || enabled.value !== 'true') {
      return;
    }

    const sender = db.prepare("SELECT value FROM settings WHERE key = 'whatsapp_sender_number'").get() as any;
    const senderNum = sender ? sender.value : 'ClassTrack';

    console.log(`[WhatsApp Notification] From: ${senderNum}, To: ${to}, Message: ${message}`);
    // In a real implementation, you would use an API like Twilio or WhatsApp Business API
    // Example with Twilio:
    /*
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const client = require('twilio')(accountSid, authToken);
    
    await client.messages.create({
      body: message,
      from: `whatsapp:${senderNum}`,
      to: `whatsapp:${to}`
    });
    */
  };

  // Attendance
  app.get("/api/attendance", (req, res) => {
    const { date, classId } = req.query;
    const records = db.prepare(`
      SELECT a.*, s.name as student_name 
      FROM attendance a
      JOIN students s ON a.student_id = s.id
      WHERE a.date = ? AND s.class_id = ?
    `).all(date, classId);
    res.json(records);
  });

  app.post("/api/attendance", (req, res) => {
    const { records, date, senderName } = req.body; // records: [{studentId, status}]
    const insert = db.prepare("INSERT OR REPLACE INTO attendance (student_id, date, status) VALUES (?, ?, ?)");
    const getStudent = db.prepare("SELECT name, phone FROM students WHERE id = ?");
    
    const transaction = db.transaction((recs) => {
      for (const rec of recs) {
        insert.run(rec.studentId, date, rec.status);
        
        // Send WhatsApp Notification
        const student = getStudent.get(rec.studentId) as any;
        if (student && student.phone) {
          const message = `ClassTrack Notification: Your ward ${student.name} has been marked ${rec.status} for today (${date}).\n- From: ${senderName}`;
          sendWhatsAppNotification(student.phone, message).catch(err => console.error("WhatsApp Error:", err));
        }
      }
    });

    transaction(records);
    res.json({ success: true });
  });

  // Teacher Attendance
  app.get("/api/teacher-attendance", (req, res) => {
    const { date } = req.query;
    const records = db.prepare(`
      SELECT ta.*, t.name as teacher_name 
      FROM teacher_attendance ta
      JOIN teachers t ON ta.teacher_id = t.id
      WHERE ta.date = ?
    `).all(date);
    res.json(records);
  });

  app.post("/api/teacher-attendance", (req, res) => {
    const { records, date } = req.body;
    const insert = db.prepare("INSERT OR REPLACE INTO teacher_attendance (teacher_id, date, status) VALUES (?, ?, ?)");
    
    const transaction = db.transaction((recs) => {
      for (const rec of recs) {
        insert.run(rec.teacherId, date, rec.status);
      }
    });

    transaction(records);
    res.json({ success: true });
  });

  // Homework
  app.get("/api/homework", (req, res) => {
    const { date, classId } = req.query;
    const records = db.prepare(`
      SELECT h.*, s.name as student_name 
      FROM homework h
      JOIN students s ON h.student_id = s.id
      WHERE h.date = ? AND s.class_id = ?
    `).all(date, classId);
    res.json(records);
  });

  app.post("/api/homework", (req, res) => {
    const { records, date, senderName } = req.body; // records: [{studentId, status}]
    const insert = db.prepare("INSERT OR REPLACE INTO homework (student_id, date, status) VALUES (?, ?, ?)");
    const getStudent = db.prepare("SELECT name, phone FROM students WHERE id = ?");
    
    const transaction = db.transaction((recs) => {
      for (const rec of recs) {
        insert.run(rec.studentId, date, rec.status);

        // Send WhatsApp Notification
        const student = getStudent.get(rec.studentId) as any;
        if (student && student.phone) {
          const statusText = rec.status === 'well done' ? 'Well Done' : (rec.status === 'done' ? 'Done' : 'Not Done');
          const message = `ClassTrack Notification: Homework status for ${student.name} on ${date} is: ${statusText}.\n- From: ${senderName}`;
          sendWhatsAppNotification(student.phone, message).catch(err => console.error("WhatsApp Error:", err));
        }
      }
    });

    transaction(records);
    res.json({ success: true });
  });

  // Test Marks
  app.get("/api/test-marks", (req, res) => {
    const { classId, testName } = req.query;
    let query = `
      SELECT tm.*, s.name as student_name 
      FROM test_marks tm
      JOIN students s ON tm.student_id = s.id
      WHERE 1=1
    `;
    const params: any[] = [];
    if (classId) {
      query += " AND s.class_id = ?";
      params.push(classId);
    }
    if (testName) {
      query += " AND tm.test_name = ?";
      params.push(testName);
    }
    const records = db.prepare(query).all(...params);
    res.json(records);
  });

  app.post("/api/test-marks", (req, res) => {
    const { records, testName, date, maxMarks, senderName } = req.body; // records: [{studentId, marks}]
    const insert = db.prepare("INSERT INTO test_marks (student_id, test_name, date, marks, max_marks) VALUES (?, ?, ?, ?, ?)");
    const getStudent = db.prepare("SELECT name, phone FROM students WHERE id = ?");
    
    const transaction = db.transaction((recs) => {
      for (const rec of recs) {
        insert.run(rec.studentId, testName, date, rec.marks, maxMarks);

        // Send WhatsApp Notification
        const student = getStudent.get(rec.studentId) as any;
        if (student && student.phone) {
          const message = `ClassTrack Notification: ${student.name} scored ${rec.marks}/${maxMarks} in the test "${testName}" held on ${date}.\n- From: ${senderName}`;
          sendWhatsAppNotification(student.phone, message).catch(err => console.error("WhatsApp Error:", err));
        }
      }
    });

    transaction(records);
    res.json({ success: true });
  });

  // Performance Summary
  app.get("/api/performance/:studentId", (req, res) => {
    const { studentId } = req.params;
    const { month } = req.query; // format: YYYY-MM
    
    const attendance = db.prepare(`
      SELECT status, COUNT(*) as count 
      FROM attendance 
      WHERE student_id = ? AND date LIKE ?
      GROUP BY status
    `).all(studentId, `${month}%`);

    const homework = db.prepare(`
      SELECT status, COUNT(*) as count 
      FROM homework 
      WHERE student_id = ? AND date LIKE ?
      GROUP BY status
    `).all(studentId, `${month}%`);

    const tests = db.prepare(`
      SELECT test_name, marks, max_marks, date
      FROM test_marks
      WHERE student_id = ? AND date LIKE ?
    `).all(studentId, `${month}%`);

    res.json({ attendance, homework, tests });
  });

  // Settings
  app.get("/api/settings", (req, res) => {
    const settings = db.prepare("SELECT * FROM settings").all() as any[];
    const result: Record<string, string> = {};
    settings.forEach(s => result[s.key] = s.value);
    res.json(result);
  });

  app.post("/api/settings", (req, res) => {
    const { settings } = req.body; // { key: value }
    const upsert = db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)");
    const transaction = db.transaction((sets) => {
      for (const [key, value] of Object.entries(sets)) {
        upsert.run(key, value);
      }
    });
    transaction(settings);
    res.json({ success: true });
  });

  // Stats
  app.get("/api/stats", (req, res) => {
    const stats = {
      teachers: db.prepare("SELECT COUNT(*) as count FROM teachers").get().count,
      classes: db.prepare("SELECT COUNT(*) as count FROM classes").get().count,
      students: db.prepare("SELECT COUNT(*) as count FROM students").get().count,
    };
    res.json(stats);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
