export function ok(res, data, message = 'Success') {
  return res.status(200).json({ success: true, message, data });
}

export function created(res, data, message = 'Created') {
  return res.status(201).json({ success: true, message, data });
}

export function paginated(res, data, meta) {
  return res.status(200).json({ success: true, data, meta });
}

export function noContent(res) {
  return res.status(204).send();
}
