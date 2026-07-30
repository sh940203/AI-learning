const express = require('express');
const router = express.Router();
const Announcement = require('../models/Announcement');

// @route   GET /api/announcements
// @desc    Get all announcements
// @access  Public
router.get('/', async (req, res) => {
  try {
    const isPublic = req.query.public === 'true';
    // If public, fetch announcements that are not explicitly hidden
    const query = isPublic ? { isVisible: { $ne: false } } : {};
    
    // Sort by isPinned descending, then createdAt descending
    const announcements = await Announcement.find(query).sort({ isPinned: -1, createdAt: -1 });
    res.json(announcements);
  } catch (err) {
    console.error('Fetch Announcements Error:', err.message);
    res.status(500).send('伺服器錯誤');
  }
});

// @route   POST /api/announcements
// @desc    Create an announcement
// @access  Public (Temporary for testing)
router.post('/', async (req, res) => {
  try {
    const { title, content, tag, isVisible, isPinned } = req.body;

    const newAnnouncement = new Announcement({
      title,
      content,
      tag,
      isVisible: isVisible !== undefined ? isVisible : true,
      isPinned: isPinned || false
    });

    const announcement = await newAnnouncement.save();
    res.status(201).json(announcement);
  } catch (err) {
    console.error('Create Announcement Error:', err.message);
    res.status(500).send('伺服器錯誤');
  }
});

// @route   PUT /api/announcements/:id
// @desc    Update an announcement
// @access  Public (Temporary for testing)
router.put('/:id', async (req, res) => {
  try {
    const { title, content, tag, isVisible, isPinned } = req.body;

    let announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ message: '找不到此公告' });
    }

    if (title !== undefined) announcement.title = title;
    if (content !== undefined) announcement.content = content;
    if (tag !== undefined) announcement.tag = tag;
    if (isVisible !== undefined) announcement.isVisible = isVisible;
    if (isPinned !== undefined) announcement.isPinned = isPinned;

    await announcement.save();
    res.json(announcement);
  } catch (err) {
    console.error('Update Announcement Error:', err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: '找不到此公告' });
    }
    res.status(500).send('伺服器錯誤');
  }
});

// @route   DELETE /api/announcements/:id
// @desc    Delete an announcement
// @access  Public (Temporary for testing)
router.delete('/:id', async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ message: '找不到此公告' });
    }

    await announcement.deleteOne();
    res.json({ message: '公告已刪除' });
  } catch (err) {
    console.error('Delete Announcement Error:', err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: '找不到此公告' });
    }
    res.status(500).send('伺服器錯誤');
  }
});

module.exports = router;
