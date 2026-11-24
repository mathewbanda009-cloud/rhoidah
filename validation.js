function invalid(message) {
  return Object.assign(new Error(message), { status: 400 });
}

function parseId(value) {
  const id = Number(value);
  if (!/^\d+$/.test(value) || !Number.isSafeInteger(id) || id < 1) {
    throw invalid('Id must be a positive whole number within the safe integer range.');
  }
  return id;
}

function validateRecord(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw invalid('Send a JSON object with title, category, description and status.');
  }
  const fields = {};
  for (const [key, label, minimum, maximum] of [
    ['title', 'Title', 3, 80],
    ['category', 'Category', 2, 40],
    ['description', 'Description', 5, 300],
    ['status', 'Status'],
  ]) {
    if (typeof body[key] !== 'string') throw invalid(`${label} is required and must be a string.`);
    if (body[key].includes('\0') || !body[key].isWellFormed()) {
      throw invalid(`${label} must contain valid Unicode text without NUL characters.`);
    }
    const value = body[key].trim();
    if (key !== 'status' && (value.length < minimum || value.length > maximum)) {
      throw invalid(`${label} must have ${minimum} to ${maximum} characters.`);
    }
    fields[key] = value;
  }
  if (!['Pending', 'In progress', 'Completed'].includes(fields.status)) {
    throw invalid('Status must be Pending, In progress, or Completed.');
  }
  // A supplied id or other extra fields are never passed to the database.
  return fields;
}

module.exports = { parseId, validateRecord };
