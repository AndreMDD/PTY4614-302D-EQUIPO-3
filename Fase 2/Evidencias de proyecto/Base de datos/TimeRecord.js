import mongoose from 'mongoose';

const breakSchema = new mongoose.Schema({
  start: {
    type: Date,
    required: true,
    default: Date.now,
  },
  end: {
    type: Date,
  },
  reason: {
    type: String,
    enum: ['Comida / Almuerzo', 'Descanso Corto', 'Médico', 'Asuntos Propios', 'Otro'],
    default: 'Comida / Almuerzo',
  },
  durationMinutes: {
    type: Number,
    default: 0,
  },
});

const taskSessionSchema = new mongoose.Schema({
  area: {
    type: String,
    default: 'General',
    trim: true,
  },
  taskName: {
    type: String,
    required: true,
    trim: true,
  },
  category: {
    type: String,
    default: 'General',
    trim: true,
  },
  priority: {
    type: String,
    enum: ['Alta', 'Media', 'Baja'],
    default: 'Media',
  },
  start: {
    type: Date,
    required: true,
    default: Date.now,
  },
  end: {
    type: Date,
  },
  durationMinutes: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['IN_PROGRESS', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'],
    default: 'IN_PROGRESS',
    index: true,
  },
  reviewNotes: {
    type: String,
    default: '',
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
  },
  reviewedAt: {
    type: Date,
  },
  notes: {
    type: String,
    default: '',
  },
  captures: [
    {
      url: { type: String, required: true },
      name: { type: String, default: 'Captura' },
      createdAt: { type: Date, default: Date.now },
    },
  ],
  voiceNotes: [
    {
      audioUrl: { type: String, required: true },
      duration: { type: String, default: '0:15' },
      author: { type: String, default: 'Colaborador' },
      createdAt: { type: Date, default: Date.now },
    },
  ],
  isTransversal: {
    type: Boolean,
    default: false,
  },
  transversalKnowledge: {
    title: { type: String, default: '' },
    tags: [{ type: String }],
    summary: { type: String, default: '' },
  },
});

const timeRecordSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    date: {
      type: String, // Formato YYYY-MM-DD
      required: true,
      index: true,
    },
    clockIn: {
      type: Date,
      required: true,
      default: Date.now,
    },
    clockOut: {
      type: Date,
    },
    currentArea: {
      type: String,
      default: '',
      trim: true,
    },
    currentTask: {
      type: String,
      default: '',
      trim: true,
    },
    tasks: [taskSessionSchema],
    breaks: [breakSchema],
    status: {
      type: String,
      enum: ['WORKING', 'ON_BREAK', 'COMPLETED'],
      default: 'WORKING',
      index: true,
    },
    totalWorkMinutes: {
      type: Number,
      default: 0,
    },
    totalBreakMinutes: {
      type: Number,
      default: 0,
    },
    taskBreakdown: [
      {
        taskName: { type: String, required: true },
        totalMinutes: { type: Number, default: 0 },
        formattedDuration: { type: String, default: '0m' },
      },
    ],
    areaBreakdown: [
      {
        areaName: { type: String, required: true },
        totalMinutes: { type: Number, default: 0 },
        formattedDuration: { type: String, default: '0m' },
      },
    ],
    notes: {
      type: String,
      default: '',
    },
    ipAddress: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Middleware para calcular minutos trabajados, descansos y desglose de tareas y áreas
timeRecordSchema.methods.calculateMinutes = function () {
  let breakMins = 0;

  // 1. Calcular descansos
  if (this.breaks && this.breaks.length > 0) {
    this.breaks.forEach((b) => {
      if (b.start && b.end) {
        const diffMs = new Date(b.end) - new Date(b.start);
        const mins = Math.max(0, Math.round(diffMs / 60000));
        b.durationMinutes = mins;
        breakMins += mins;
      }
    });
  }
  this.totalBreakMinutes = breakMins;

  // 2. Calcular duraciones de tareas individuales y agrupar por nombre de tarea y área
  const taskTotals = {};
  const areaTotals = {};

  if (this.tasks && this.tasks.length > 0) {
    this.tasks.forEach((t) => {
      if (t.start) {
        const endTime = t.end ? new Date(t.end) : (this.clockOut ? new Date(this.clockOut) : new Date());
        const diffMs = endTime - new Date(t.start);
        const mins = Math.max(0, Math.round(diffMs / 60000));
        if (t.end) {
          t.durationMinutes = mins;
        }
        const name = t.taskName || 'General';
        const area = t.area || this.currentArea || 'General';

        taskTotals[name] = (taskTotals[name] || 0) + mins;
        areaTotals[area] = (areaTotals[area] || 0) + mins;
      }
    });
  }

  const formatMins = (mins) => {
    const hrs = Math.floor(mins / 60);
    const remainderMins = mins % 60;
    if (hrs > 0 && remainderMins > 0) return `${hrs}h ${remainderMins}m`;
    if (hrs > 0) return `${hrs}h`;
    return `${remainderMins}m`;
  };

  // Construir taskBreakdown
  this.taskBreakdown = Object.entries(taskTotals).map(([name, mins]) => ({
    taskName: name,
    totalMinutes: mins,
    formattedDuration: formatMins(mins),
  }));

  // Construir areaBreakdown
  this.areaBreakdown = Object.entries(areaTotals).map(([name, mins]) => ({
    areaName: name,
    totalMinutes: mins,
    formattedDuration: formatMins(mins),
  }));

  // 3. Minutos totales trabajados
  if (this.clockIn && this.clockOut) {
    const totalSpanMs = new Date(this.clockOut) - new Date(this.clockIn);
    const totalSpanMins = Math.max(0, Math.round(totalSpanMs / 60000));
    this.totalWorkMinutes = Math.max(0, totalSpanMins - breakMins);
  }
};

export const TimeRecord = mongoose.model('TimeRecord', timeRecordSchema);
