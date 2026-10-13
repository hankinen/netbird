import { afterAll, describe, expect, it } from "vitest";
import { i18n, initLanguage, loadNamespaces, t } from "@/i18n";
import { translateApiError } from "@/i18n/apiErrors";
import { normalizeLanguage } from "@/i18n/config";

describe("i18n", () => {
  afterAll(() => i18n.changeLanguage("en"));

  it("returns English by default", () => {
    expect(t("common:word.cancel")).toBe("Cancel");
  });

  it("loads zh-CN namespaces lazily", async () => {
    await initLanguage("zh-CN");
    expect(t("common:word.cancel")).toBe("取消");
    await loadNamespaces(["setup-keys.main"]);
    expect(t("setup-keys.main:setupKeysTable.text.createKey")).toBe("创建密钥");
  });

  it("maps known API errors and keeps unknown ones", async () => {
    await initLanguage("zh-CN");
    expect(translateApiError("token expired")).toBe("会话已过期，请重新登录。");
    expect(translateApiError("some new error")).toBe("some new error");
    expect(translateApiError("group has been linked to policy: p1")).toBe(
      "该组正在被使用，无法删除。 (group has been linked to policy: p1)",
    );
    expect(translateApiError("unable to block owner user")).toBe(
      "不能禁用所有者用户。",
    );
  });

  it("normalizes language codes", () => {
    expect(normalizeLanguage("zh")).toBe("zh-CN");
    expect(normalizeLanguage("en-GB")).toBe("en");
    expect(normalizeLanguage("de")).toBeUndefined();
  });
});
