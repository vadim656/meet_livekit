import { useToast } from "primevue/usetoast";

export default function () {
  const toast = useToast();

  const showSuccess = (params: string) => {
    toast.add({
      severity: "success",
      summary: "Успешно",
      detail: params,
      life: 3000,
    });
  };

  const showInfo = (params: string) => {
    toast.add({
      severity: "info",
      summary: "Info Message",
      detail: params,
      life: 3000,
    });
  };

  const showWarn = (params: string) => {
    toast.add({
      severity: "warn",
      summary: "Внимание",
      detail: params,
      life: 3000,
    });
  };

  const showError = (params: string) => {
    toast.add({
      severity: "error",
      summary: "Ошибка",
      detail: params,
      life: 3000,
    });
  };

  const showSecondary = (params: string) => {
    toast.add({
      severity: "secondary",
      summary: "Secondary Message",
      detail: params,
      life: 3000,
    });
  };

  const showContrast = (params: string) => {
    toast.add({
      severity: "contrast",
      summary: "Contrast Message",
      detail: params,
      life: 3000,
    });
  };

  return {
    showSuccess,
    showInfo,
    showWarn,
    showError,
    showSecondary,
    showContrast,
  };
}
