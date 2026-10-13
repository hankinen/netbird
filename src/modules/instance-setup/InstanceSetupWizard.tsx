"use client";

import { cn } from "@utils/helpers";
import { CheckCircle2, Loader2 } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { ApiError, SetupRequest } from "@/interfaces/Instance";
import { submitSetup } from "@/utils/unauthenticatedApi";
import { NetBirdLogo } from "@components/NetBirdLogo";
import Button from "@components/Button";
import { Label } from "@components/Label";
import { Input } from "@components/Input";
import HelpText from "@components/HelpText";
import { GradientFadedBackground } from "@components/ui/GradientFadedBackground";

import { t } from "@/i18n";
import { translateApiError } from "@/i18n/apiErrors";
interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  name?: string;
  general?: string;
}

const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,63}$/i;

export default function InstanceSetupWizard() {
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [countdown, setCountdown] = useState(3);

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = t(
        "instance-setup.main:instanceSetupWizard.text.emailIsRequired",
      );
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = t(
        "instance-setup.main:instanceSetupWizard.text.pleaseEnterAValidEmail",
      );
    }

    if (!formData.password) {
      newErrors.password = t(
        "instance-setup.main:instanceSetupWizard.text.passwordIsRequired",
      );
    } else if (formData.password.length < 8) {
      newErrors.password = t(
        "instance-setup.main:instanceSetupWizard.text.passwordMustBeAtLeast",
      );
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = t(
        "instance-setup.main:instanceSetupWizard.text.pleaseConfirmYourPassword",
      );
    } else if (formData.confirmPassword !== formData.password) {
      newErrors.confirmPassword = t(
        "instance-setup.main:instanceSetupWizard.text.passwordsDoNotMatch",
      );
    }

    if (!formData.name.trim()) {
      newErrors.name = t(
        "instance-setup.main:instanceSetupWizard.text.nameIsRequired",
      );
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      const request: SetupRequest = {
        email: formData.email.trim(),
        password: formData.password,
        name: formData.name.trim(),
      };

      await submitSetup(request);
      setIsSuccess(true);
    } catch (err) {
      const error = err as ApiError;
      let message = t(
        "instance-setup.main:instanceSetupWizard.text.anErrorOccurredPleaseTry",
      );

      switch (error.code) {
        case 400:
          message = t(
            "instance-setup.main:instanceSetupWizard.text.invalidRequestPleaseCheckYour",
          );
          break;
        case 412:
          message = t(
            "instance-setup.main:instanceSetupWizard.text.setupHasAlreadyBeenCompleted",
          );
          setTimeout(() => (window.location.href = "/"), 2000);
          break;
        case 422:
          message =
            translateApiError(error.message) ||
            t(
              "instance-setup.main:instanceSetupWizard.text.validationErrorPleaseCheckYour",
            );
          break;
        case 500:
          message = t(
            "instance-setup.main:instanceSetupWizard.text.anErrorOccurredPleaseTry",
          );
          break;
        default:
          message = translateApiError(error.message) || message;
      }

      setErrors({ general: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (!isSuccess) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Full page reload to get fresh instance status from API
          window.location.href = "/";
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isSuccess]);

  const handleInputChange =
    (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }));
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    };

  // Surface a mismatch as soon as the operator types in the confirm field,
  // not just on submit (mirrors the invite-redeem flow).
  const passwordsMatch = formData.password === formData.confirmPassword;
  const confirmPasswordError =
    errors.confirmPassword ??
    (formData.confirmPassword && !passwordsMatch
      ? t("instance-setup.main:instanceSetupWizard.text.passwordsDoNotMatch")
      : undefined);

  if (isSuccess) {
    return (
      <div className="mt-20">
        <div className={"flex items-center justify-center"}>
          <NetBirdLogo size={"large"} mobile={false} />
        </div>
        <Card className={"max-w-[360px] mt-8 mx-auto"}>
          <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center mb-4 mx-auto">
            <CheckCircle2 className="text-green-500" size={22} />
          </div>
          <h1 className={"text-xl text-center z-10 relative"}>
            {t("instance-setup.main:instanceSetupWizard.text.accountCreated")}
          </h1>
          <div
            className={
              "text-sm text-nb-gray-300 font-light mt-2 block text-center z-10 relative"
            }
          >
            {t(
              "instance-setup.main:instanceSetupWizard.text.youAreBeingRedirectedTo",
            )}{" "}
            <span className={"text-white font-medium"}>{countdown}s</span>...
          </div>
          <div className={"flex items-center justify-center mt-4"}>
            <Button
              type="button"
              onClick={() => (window.location.href = "/")}
              variant={"primary"}
              className={"mx-auto w-full"}
            >
              {t("instance-setup.main:instanceSetupWizard.text.goToLogin")}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mt-20">
      <div className={"flex items-center justify-center"}>
        <NetBirdLogo size={"large"} mobile={false} />
      </div>
      <Card className={"max-w-[420px] mt-8 mx-auto"}>
        <h1 className={"text-xl text-center z-10 relative"}>
          {t("instance-setup.main:instanceSetupWizard.text.welcomeToNetBird")}
        </h1>
        <div
          className={
            "text-sm text-nb-gray-300 font-light mt-2 block text-center z-10 relative"
          }
        >
          {t(
            "instance-setup.main:instanceSetupWizard.text.createTheFirstAdminAccount",
          )}
        </div>

        <form
          onSubmit={handleSubmit}
          className={"flex flex-col gap-5 mt-7 z-10 relative"}
        >
          {errors.general && <ErrorMessage error={errors.general} />}
          <div>
            <Label htmlFor={"name"}>{t("common:word.name")}</Label>
            <Input
              type="text"
              id="name"
              value={formData.name}
              onChange={handleInputChange("name")}
              placeholder={t(
                "instance-setup.main:instanceSetupWizard.placeholder.yourName",
              )}
              disabled={isSubmitting}
              autoFocus
              error={errors.name}
            />
          </div>

          <div>
            <Label htmlFor={"email"}>
              {t("instance-setup.main:instanceSetupWizard.text.email")}
            </Label>
            <Input
              type="email"
              id="email"
              value={formData.email}
              onChange={handleInputChange("email")}
              placeholder={t(
                "instance-setup.main:instanceSetupWizard.placeholder.adminExampleCom",
              )}
              disabled={isSubmitting}
              error={errors.email}
            />
          </div>

          <div>
            <Label htmlFor={"password"}>
              {t("instance-setup.main:instanceSetupWizard.text.password")}
            </Label>
            <Input
              type={"password"}
              id="password"
              value={formData.password}
              onChange={handleInputChange("password")}
              placeholder={t(
                "instance-setup.main:instanceSetupWizard.placeholder.enterAStrongPassword",
              )}
              disabled={isSubmitting}
              error={errors.password}
              showPasswordToggle={true}
            />
            <HelpText className={"mt-2"}>
              {t("instance-setup.main:instanceSetupWizard.text.mustBeAtLeast8")}
            </HelpText>
          </div>

          <div>
            <Label htmlFor={"confirmPassword"}>
              {t(
                "instance-setup.main:instanceSetupWizard.text.confirmPassword",
              )}
            </Label>
            <Input
              type={"password"}
              id="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange("confirmPassword")}
              placeholder={t(
                "instance-setup.main:instanceSetupWizard.placeholder.reEnterYourPassword",
              )}
              disabled={isSubmitting}
              error={confirmPasswordError}
              showPasswordToggle={true}
            />
          </div>

          <Button
            type={"submit"}
            disabled={isSubmitting}
            variant={"primary"}
            className={"w-full"}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin" size={16} />
                {t(
                  "instance-setup.main:instanceSetupWizard.text.creatingAccount",
                )}
              </>
            ) : (
              t(
                "instance-setup.main:instanceSetupWizard.text.createAdminAccount",
              )
            )}
          </Button>
        </form>
      </Card>

      <div className={"flex items-center justify-center mt-6"}>
        <span
          className={"text-sm text-nb-gray-400 font-light pb-10 text-center"}
        >
          {t("instance-setup.main:instanceSetupWizard.text.thisIsAOneTime")}
        </span>
      </div>
    </div>
  );
}

const Card = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={cn(
        "px-6 sm:px-10 py-8 pt-6",
        "bg-nb-gray-940 border border-nb-gray-910  rounded-lg   relative",
        className,
      )}
    >
      <GradientFadedBackground />
      {children}
    </div>
  );
};

const ErrorMessage = ({ error }: { error?: string }) => {
  return (
    <div className="text-red-400 bg-red-800/20 border border-red-800/50 rounded-lg px-4 py-3 whitespace-break-spaces my-3 text-sm">
      {error}
    </div>
  );
};
