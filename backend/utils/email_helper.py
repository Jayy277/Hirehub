from flask import current_app
from flask_mail import Message

def get_mail_extension():
    # Dynamically get mail extension initialized in app.py
    return current_app.extensions.get('mail')

def send_email(subject, recipient, html_content, text_content=""):
    """
    Sends an email using Flask-Mail. Falls back to console printing (simulation)
    if credentials are not configured or if an error occurs.
    """
    mail = get_mail_extension()
    
    # Check if SMTP is configured
    mail_username = current_app.config.get("MAIL_USERNAME")
    
    if not mail or not mail_username:
        # SMTP configuration is blank, simulate email in terminal
        print("\n" + "="*50)
        print("[EMAIL SIMULATION] (SMTP Credentials Not Configured)")
        print(f"To:      {recipient}")
        print(f"Subject: {subject}")
        print("-"*50)
        print(text_content or html_content)
        print("="*50 + "\n")
        return True

    msg = Message(
        subject=subject,
        recipients=[recipient],
        html=html_content,
        body=text_content or html_content,
        sender=current_app.config.get("MAIL_DEFAULT_SENDER", "noreply@hirehub.com")
    )

    try:
        mail.send(msg)
        return True
    except Exception as e:
        # Fallback to simulation on connection failure
        print("\n" + "="*50)
        print(f"[EMAIL ERROR] (SMTP Connection Failed: {e})")
        print(f"To:      {recipient}")
        print(f"Subject: {subject}")
        print("-"*50)
        print(text_content or html_content)
        print("="*50 + "\n")
        return False

def send_application_submitted_email(student_email, student_name, internship_title, company_name):
    subject = f"Application Received: {internship_title} at {company_name}"
    html_content = f"""
    <h3>Dear {student_name},</h3>
    <p>You have successfully applied for the internship <strong>{internship_title}</strong> at <strong>{company_name}</strong>.</p>
    <p>The company has been notified, and you can track the progress of your application on your dashboard.</p>
    <br>
    <p>Best regards,<br>HireHub Team</p>
    """
    text_content = f"Dear {student_name},\n\nYou have successfully applied for the internship: {internship_title} at {company_name}.\nYou can track the progress of your application on your dashboard.\n\nBest regards,\nHireHub Team"
    return send_email(subject, student_email, html_content, text_content)

def send_application_status_email(student_email, student_name, internship_title, company_name, status):
    subject = f"Application Update: {internship_title} at {company_name}"
    
    status_text = "Accepted" if status.lower() == "accepted" else "Rejected"
    status_color = "green" if status.lower() == "accepted" else "red"
    
    html_content = f"""
    <h3>Dear {student_name},</h3>
    <p>There is an update on your application for <strong>{internship_title}</strong> at <strong>{company_name}</strong>.</p>
    <p>Your application status is: <strong style="color: {status_color};">{status_text}</strong>.</p>
    <p>Log in to your HireHub dashboard for more details.</p>
    <br>
    <p>Best regards,<br>HireHub Team</p>
    """
    text_content = f"Dear {student_name},\n\nThere is an update on your application for {internship_title} at {company_name}.\nYour application status is: {status_text}.\n\nLog in to your HireHub dashboard for more details.\n\nBest regards,\nHireHub Team"
    return send_email(subject, student_email, html_content, text_content)
