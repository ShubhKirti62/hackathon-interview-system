# Question Bulk Upload Format

To bulk upload questions via Excel, use the following column format:

## Required Columns

| Column Name | Description | Example |
|-------------|-------------|---------|
| Question Text | The descriptive question text | "Explain the concept of closures in JavaScript" |
| Domain | The technical domain | "Frontend", "Backend", "DevOps", etc. |
| Experience Level | Target experience level | "Fresher/Intern", "1-2 years", "2-4 years", etc. |
| Difficulty | Question difficulty | "Easy", "Medium", "Hard" |

## Sample Excel Format

```
| Question Text                           | Domain   | Experience Level | Difficulty |
|----------------------------------------|----------|------------------|------------|
| Explain React hooks and their use cases | Frontend | 1-2 years        | Medium     |
| What is database normalization?        | Backend  | Fresher/Intern   | Easy       |
| Describe microservices architecture    | DevOps   | 4-6 years        | Hard       |
```

## Notes

- All questions are treated as descriptive type (no MCQ support)
- Each row must have values for all required columns
- Questions will be automatically marked as unverified and need admin approval
- Duplicate questions are allowed but not recommended
