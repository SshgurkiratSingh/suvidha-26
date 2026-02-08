# Quick Start: Using Saved Answers

## For Citizens

### How to Save Your Answers

1. **Complete an eligibility survey** on any scheme
2. On the **last question**, look for the checkbox:
   ```
   ☑ Save my answers for future scheme applications
   ```
3. **Check the box** if you want to save time on future applications
4. **Submit** the survey
5. ✅ You'll see: "Your answers have been saved for future use!"

### How Pre-fill Works

Next time you apply to a different scheme:

1. Navigate to the scheme and click **"Check Eligibility & Apply"**
2. You'll see:
   ```
   ✓ Some answers will be pre-filled from your profile
   ```
3. Questions with matching text will show:
   ```
   ✓ Pre-filled from your saved profile
   ```
4. **Review** pre-filled answers (you can change any of them)
5. **Answer** remaining questions
6. **Submit** as usual

### Managing Your Saved Answers

Go to **Profile** page → **"Saved Scheme Answers"** section:

#### View Saved Answers

- See all questions and answers you've saved
- Check when each answer was saved

#### Enable/Disable Saving

- Toggle the switch to turn saving ON or OFF
- When OFF, future surveys won't be saved
- Your existing saved answers are kept

#### Clear All Answers

- Click **"Clear All"** button
- Confirm the action
- ⚠️ This cannot be undone!

---

## For Admins

### Creating Reusable Questions

To maximize answer reuse across schemes:

#### ✅ DO:

```javascript
// Use same exact text across schemes
"Do you own the property?";
"What is your annual household income?";
"What is your age?";
```

#### ❌ DON'T:

```javascript
// Different wording for same question
Scheme 1: "Do you own the property?"
Scheme 2: "Are you the property owner?"  // Won't match!
```

### Standard Questions Library

Copy these exact questions for maximum reuse:

#### Property Ownership

```
Question: "Do you own the property?"
Type: YES_NO
```

#### Income

```
Question: "What is your annual household income?"
Type: SINGLE_CHOICE
Options:
  - Less than ₹2 Lakhs
  - ₹2-5 Lakhs
  - ₹5-10 Lakhs
  - Above ₹10 Lakhs
```

#### Age

```
Question: "What is your age?"
Type: NUMBER
Validation: min: 18, max: 100
```

#### Gender

```
Question: "What is your gender?"
Type: SINGLE_CHOICE
Options:
  - Male
  - Female
  - Other
```

#### Electricity Connection

```
Question: "Do you have an active electricity connection?"
Type: YES_NO
```

#### Employment Status

```
Question: "What is your current employment status?"
Type: SINGLE_CHOICE
Options:
  - Employed (Government)
  - Employed (Private)
  - Self-employed
  - Unemployed
  - Retired
  - Student
```

### Question Matching Rules

Answers will pre-fill ONLY if:

1. ✅ Question text matches **EXACTLY** (case-sensitive)
2. ✅ Question type is the **SAME**
3. ✅ User has given **consent** to save answers

---

## Examples

### Example 1: Perfect Match

**Saved Answer:**

```
Question: "Do you own the property?"
Type: YES_NO
Answer: YES
```

**New Scheme Question:**

```
Question: "Do you own the property?"
Type: YES_NO
```

**Result:** ✅ Pre-filled with "YES"

---

### Example 2: Text Mismatch

**Saved Answer:**

```
Question: "Do you own the property?"
Answer: YES
```

**New Scheme Question:**

```
Question: "Are you the property owner?"  ❌ Different text
```

**Result:** ❌ NOT pre-filled (must answer manually)

---

### Example 3: Type Mismatch

**Saved Answer:**

```
Question: "What is your age?"
Type: NUMBER
Answer: 32
```

**New Scheme Question:**

```
Question: "What is your age?"
Type: TEXT  ❌ Different type
```

**Result:** ❌ NOT pre-filled (type doesn't match)

---

### Example 4: Partial Pre-fill

**Saved Answers:**

```
1. "Do you own the property?" → YES
2. "What is your age?" → 32
3. "What is your gender?" → Male
```

**New Scheme Questions:**

```
1. "Do you own the property?" ✅ Match
2. "What is your income?" ❌ No saved answer
3. "What is your age?" ✅ Match
4. "Do you have dependents?" ❌ No saved answer
5. "What is your gender?" ✅ Match
```

**Result:**

- Question 1: ✅ Pre-filled with "YES"
- Question 2: ⚠️ Must answer manually
- Question 3: ✅ Pre-filled with "32"
- Question 4: ⚠️ Must answer manually
- Question 5: ✅ Pre-filled with "Male"

---

## FAQ

### Q: Is my data safe?

**A:** Yes! Your saved answers are:

- Encrypted in the database
- Only accessible by you
- Never shared with admins or other users
- Deleted when you clear them or delete your account

### Q: Can I change a pre-filled answer?

**A:** Yes! Pre-filled answers are just suggestions. You can modify any answer before submitting.

### Q: What happens if I disable consent?

**A:** When you toggle consent OFF:

- Your existing saved answers are **kept** in the database
- Future surveys won't use pre-fill
- You can toggle ON again to resume using pre-fill

### Q: What happens if I clear all answers?

**A:** When you click "Clear All":

- All saved answers are **permanently deleted**
- This cannot be undone
- Your consent setting remains unchanged
- Future surveys will have no pre-fill until you save new answers

### Q: How many schemes can reuse my answers?

**A:** Unlimited! Any scheme with matching questions (exact text + same type) will use your saved answers.

### Q: Can I export my saved answers?

**A:** Not currently. This feature may be added in the future.

### Q: Will my answers expire?

**A:** No. Saved answers remain until you manually clear them.

---

## Privacy Notice

When you enable "Save my answers for future scheme applications":

✅ **We WILL:**

- Store your survey answers securely
- Use them to pre-fill future eligibility surveys
- Let you view, modify, or delete them anytime
- Delete them if you delete your account

❌ **We WILL NOT:**

- Share your answers with anyone
- Use them for any purpose other than pre-filling
- Sell or analyze your data
- Access them without your permission

You can disable this feature anytime in your Profile settings.

---

## Support

Having issues with saved answers?

1. Check if consent is enabled in Profile → Saved Scheme Answers
2. Verify the question text matches exactly
3. Ensure you're logged in when viewing schemes
4. Try clearing browser cache and logging in again

Still having problems? Contact support with:

- Your user ID
- Which scheme you're trying to apply to
- Screenshot of the issue

---

**Last Updated:** February 8, 2026  
**Version:** 1.0
