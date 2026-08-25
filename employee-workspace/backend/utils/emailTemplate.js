export const emailTemplate = (title, content) => `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
</head>

<body style="margin:0;padding:0;background:#f4f6f9;font-family:Arial,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0">
<tr>
<td align="center">

<table width="700" cellpadding="0" cellspacing="0"
style="background:#ffffff;border-radius:12px;overflow:hidden;margin:30px 0;">

<tr>
<td
style="
background:#0b4d3a;
padding:24px;
color:#fff;
text-align:center;
"
>
<h1 style="margin:0;">UPSILON SERVICES</h1>
<p style="margin-top:8px;">
Employee Management System
</p>
</td>
</tr>

<tr>
<td style="padding:30px;">
<h2 style="color:#0b4d3a;">
${title}
</h2>

${content}
</td>
</tr>

<tr>
<td
style="
background:#f8fafc;
padding:20px;
text-align:center;
font-size:12px;
color:#64748b;
"
>
© ${new Date().getFullYear()} Upsilon Services Pvt Ltd
<br/>
Automated notification from EMS
</td>
</tr>

</table>

</td>
</tr>
</table>

</body>
</html>
`;