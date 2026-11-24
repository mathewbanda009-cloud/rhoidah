-- Eight fictional IT Support Desk requests. IDs come from the database.
-- db.js inserts these once, inside the same transaction as its setup marker.
INSERT INTO records (title, category, description, status) VALUES
('Campus Wi-Fi connection problem', 'Network',
 'A fictional student needs help connecting a laptop to the library wireless network.', 'Pending'),
('Student portal account locked', 'Account access',
 'A fictional account is locked after several unsuccessful sign-in attempts.', 'In progress'),
('Library printing queue paused', 'Printing',
 'The demonstration library printer has stopped processing documents in its queue.', 'Pending'),
('Spreadsheet application setup', 'Software',
 'A fictional student needs the approved spreadsheet application configured for class.', 'Completed'),
('Campus email setup on phone', 'Email',
 'A fictional student requests help setting up campus email on a mobile phone.', 'In progress'),
('Computer lab mouse replacement', 'Hardware',
 'A demonstration computer lab mouse has a damaged cable and needs replacement.', 'Completed'),
('Online learning page unavailable', 'Learning platform',
 'A fictional student sees an error while opening a course on the learning platform.', 'Pending'),
('Classroom projector connection', 'Classroom equipment',
 'A fictional presenter needs help displaying a laptop screen through a classroom projector.', 'In progress');
