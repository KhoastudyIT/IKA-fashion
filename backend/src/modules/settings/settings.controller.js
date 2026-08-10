import * as settingsService from './settings.service.js';
import { ok } from '../../utils/response.js';

export async function get(_req, res) {
  ok(res, await settingsService.getSettings());
}

export async function update(req, res) {
  const settings = await settingsService.updateSettings(req.body);
  ok(res, settings, 'Cập nhật cấu hình thành công');
}
