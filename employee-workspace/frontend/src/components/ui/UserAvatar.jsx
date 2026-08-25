const getInitials = (name = "User") =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "U";

const UserAvatar = ({ name, photoUrl, size = "medium", className = "" }) => (
  <span className={`ui-avatar ui-avatar--${size} ${className}`.trim()} aria-hidden="true">
    {photoUrl ? <img src={photoUrl} alt="" /> : getInitials(name)}
  </span>
);

export default UserAvatar;
