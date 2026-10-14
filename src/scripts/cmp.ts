interface TCData {
  eventStatus: string;
  gdprApplies?: boolean;
  tcString?: string;
  purpose?: { consents: Record<string, boolean> };
  vendor?: { consents: Record<string, boolean> };
}
declare global {
  interface Window {
    __tcfapi?: (
      command: string,
      version: number,
      callback: (data: TCData, success: boolean) => void,
    ) => void;
  }
}
export function connectCmp(
  scriptUrl: string,
  onChange: (allowed: boolean) => void,
) {
  // La certificación y la configuración del proveedor se comprueban en su panel, no se inventan aquí.
  if (!document.getElementById('certified-cmp')) {
    const script = document.createElement('script');
    script.id = 'certified-cmp';
    script.src = scriptUrl;
    script.async = true;
    document.head.append(script);
  }
  let attempts = 0;
  function attach() {
    if (!window.__tcfapi) {
      if (++attempts < 100) window.setTimeout(attach, 100);
      return;
    }
    window.__tcfapi('addEventListener', 2, (data, success) => {
      if (
        !success ||
        !['tcloaded', 'useractioncomplete'].includes(data.eventStatus)
      )
        return;
      const allowed =
        data.gdprApplies === false ||
        Boolean(
          data.tcString &&
          data.vendor?.consents['755'] &&
          [1, 2, 3, 4, 7, 9, 10].every(
            (purpose) => data.purpose?.consents[String(purpose)],
          ),
        );
      onChange(allowed);
    });
  }
  attach();
}
