CREATE TABLE registrations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  firstName VARCHAR(255) NOT NULL,
  lastName VARCHAR(255) NOT NULL,
  grade INT NOT NULL,
  email VARCHAR(255) NOT NULL,
  shirtSize ENUM('S','M','L') NOT NULL,
  hrUsername VARCHAR(255) NOT NULL
);
