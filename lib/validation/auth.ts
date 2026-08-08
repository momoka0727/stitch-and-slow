import { z } from "zod";

const email = z.email("请输入有效的邮箱地址").max(254);

export const requestEmailCodeSchema = z.strictObject({ email });

export const registerWithEmailSchema = z.strictObject({
  name: z.string().trim().min(1, "请输入昵称").max(64, "昵称最多 64 个字符"),
  email,
  password: z.string().min(8, "密码至少需要 8 个字符").max(128, "密码最多 128 个字符"),
  code: z.string().regex(/^\d{6}$/, "请输入 6 位验证码"),
  challengeId: z.uuid("验证码请求无效，请重新获取"),
});
