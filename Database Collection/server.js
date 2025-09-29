const express = require('express');
const connectDB = require('./db');
const Task = require('./models/Task');
const app = express();

connectDB();

app.use(express.json());

// Create a task
app.post('/tasks', async (req, res) => {
  try {
    const task = new Task(req.body);
    await task.save();
    res.status(201).json(task);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get all tasks
app.get('/tasks', async (req, res) => {
  const tasks = await Task.find();
  res.json(tasks);
});

// Mark task complete
app.patch('/tasks/:id', async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { completed: true, updatedAt: Date.now() },
      { new: true }
    );
    res.json(task);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
