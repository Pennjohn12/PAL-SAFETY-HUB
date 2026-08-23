# PAL Daily Employee Access — QR Code Plan

Status: Initial live implementation published on August 22, 2026.

The live version now includes the approved My Project's Operations Dashboard, the Home/Today/Upcoming/My History/Tools navigation, project/date-bound QR and clickable crew links, employee Daily Safety/Payroll/Toolbox confirmations, automatic master-sheet updates, employee payroll check-in fields, foreman checkout controls, session history, access closing, and secure expiration. Existing PAL foreman forms and AI-assisted tools remain in their original reusable modules and are opened directly from the new dashboard.

## Objective

Give employees a simple way to use their own phones to complete the documents required for their project that day. A foreman creates one project-specific QR code and clickable link. Opening either one displays only the active daily forms for that project and date.

The employee does not receive access to Foreman Tools, office information, other projects, or the rest of the PAL Safety Hub.

## Recommended workflow

1. The foreman opens **Daily Employee Access** from Foreman Tools.
2. The foreman selects the project and work date.
3. The app displays the documents currently available for that project and date:
   - Daily Safety Sheet
   - Daily Payroll
   - Weekly Toolbox Talk, when active
   - Any additional document requiring an employee signature that day
4. The foreman turns the appropriate forms on or off and selects **Generate QR & Link**.
5. The app creates:
   - A scannable QR code
   - A normal clickable link
   - Copy Link, Share, and Download QR controls
6. The foreman may display the QR code or send the clickable link to the crew.
7. Employees open the project-bound page on their own phones. They should not have to choose a project again.
8. The employee selects or enters their name, enters their arrival time, reviews the active information, and signs each required form.
9. Employee submissions immediately appear on the appropriate master Daily Safety, Daily Payroll, and Toolbox Talk records for that project.
10. The foreman reviews the combined records, corrects mistakes, enters employee departure times, records early departures or overtime, and completes final approval.
11. The foreman can close access manually. It should also expire automatically after the configured workday while preserving all submitted records.

## Important operating requirements

- A foreman can be responsible for multiple projects on the same day.
- Never limit a foreman to one project.
- Each QR/link must be tied to one selected project, date, and daily access session.
- The foreman can create and share access for a project even when physically working at another site.
- Employees should not see a project dropdown after opening a project-specific link.
- Employees enter their arrival time. The normal default may be 7:00 AM, but it must remain editable for late arrivals.
- The foreman enters all checkout/departure times.
- The foreman can correct employee arrival entries and handle overtime or early departures.
- Employee payroll submissions append to the existing master Daily Payroll form rather than creating disconnected payroll sheets.
- Multiple employees must be able to submit at nearly the same time without overwriting one another.
- The employee experience must be extremely simple and optimized for a phone.

## Three visual directions

### Option 1 — Daily Access Center (recommended)

Foreman view:

- One clear page titled **Daily Employee Access**.
- Project and date selectors at the top.
- A simple list of active forms with on/off controls.
- QR code and clickable link displayed beside the setup area.
- Controls for Preview, Copy Link, Share, Download QR, and Close Access.

Employee view:

- PAL branding, project name, and date.
- Large cards for Daily Safety, Daily Payroll, Toolbox Talk, and any other active document.
- A checkmark appears as each item is completed.
- One obvious **Start Today’s Forms** button.

Reason to choose it: This is the cleanest and easiest design for employees while giving the foreman all necessary controls in one place.

### Option 2 — Guided Setup

Foreman view:

- A three-step setup:
  1. Select project.
  2. Choose forms.
  3. Create and send daily access.
- A live crew-status area shows expected, completed, and still-needed submissions.

Employee view:

- Employee selects their name and arrival time first.
- The app tells them how many items must be completed.
- Forms are shown one at a time in a guided sequence.

Reason to choose it: The most instructional version for new foremen and employees, but it adds more screens and clicks.

### Option 3 — Multi-Project Board

Foreman view:

- A board showing every project assigned to the foreman that day.
- Each project displays crew count, completion count, and daily-access status.
- Selecting a project shows its QR/link, active forms, signatures, payroll arrivals, corrections, overtime, and checkout controls.

Employee view:

- A compact list showing completed and remaining forms for the project.
- Each submission clearly states that it goes to the foreman’s master project sheets.

Reason to choose it: Best for foremen managing several jobs, although it is a busier main screen.

## Recommended final design

Build **Option 1 — Daily Access Center**, then add the multi-project selector/status controls from **Option 3**.

This combination provides:

- The easiest employee phone experience
- Clear project/date binding
- Support for foremen managing multiple projects
- One QR code and one clickable link per project session
- Real-time visibility into missing signatures and payroll check-ins
- Foreman correction, checkout, and overtime controls

## Suggested data and security design

Each generated access session should have a secure, hard-to-guess token and store:

- Project ID and project name
- Work date
- Foreman/creator ID
- Active or closed status
- Expiration time
- References to the active Daily Safety, Daily Payroll, Toolbox Talk, and other forms

Employee submissions should be stored as separate records rather than one shared array. This prevents two employees submitting simultaneously from overwriting each other.

Public QR/link access should permit only the minimum required actions:

- Open the exact active session identified by the secure token
- Read only the employee-facing information for that session
- Create an employee submission containing approved fields
- Never list other sessions, projects, employees, or office records
- Never modify foreman-entered project information or another employee’s submission

For the lowest-friction daily workflow, the QR page can use a secure expiring session link without requiring a PAL account. No sensitive ID, Social Security card, union card, W-4, or onboarding document should ever be available through this daily-access page.

## Implementation stages for the next session

1. Inspect and map the existing Daily Safety, Daily Payroll, Toolbox Talk, and signature data structures.
2. Confirm how existing master forms identify project and work date.
3. Add secure daily-access sessions and submission records.
4. Add the Foreman Tools setup and multi-project controls.
5. Generate a real QR code plus clickable share link.
6. Build the restricted employee phone page.
7. Connect submissions to the existing master forms.
8. Add foreman corrections, checkout, overtime, close, and expiration controls.
9. Add Firestore security rules and validation.
10. Test on iPhone-sized and Android-sized screens.
11. Test simultaneous synthetic employee submissions on multiple projects.
12. Verify master Daily Safety, Payroll, and Toolbox Talk records update correctly before deploying live.

## Items to revisit

- Confirm whether employees select from an approved crew list, type their name, or can do either.
- Decide the default expiration time for each daily session.
- Decide whether the app should offer a Twilio send button. Sending a real message must remain a deliberate foreman action.
- Add the user’s additional feature/request during the next discussion before implementation begins.
