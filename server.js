app.get('/run-migration', async (req, res) => {
  if (req.query.key !== process.env.ADMIN_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  // paste the contents of migrateFAQs(), migrateQuestions(), migrateMembers() here
  // then remove this route after running
});