export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!('Notification' in window)) {
    console.warn('Dieser Browser unterstützt keine Desktop-Benachrichtigungen.');
    return 'denied'; // Oder 'default', da 'denied' eine explizite Ablehnung impliziert
  }
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (error) {
    console.error('Fehler bei der Anforderung der Benachrichtigungsberechtigung:', error);
    return 'denied'; // Im Fehlerfall als abgelehnt betrachten
  }
};

export const showNotification = (title: string, options?: NotificationOptions): void => {
  if (!('Notification' in window)) {
    console.warn('Dieser Browser unterstützt keine Desktop-Benachrichtigungen.');
    return;
  }

  if (Notification.permission === 'granted') {
    // eslint-disable-next-line no-new
    new Notification(title, options);
  } else if (Notification.permission === 'denied') {
    console.info('Benachrichtigungsberechtigung wurde verweigert.');
    // Hier könnte man den Benutzer informieren, wie er die Berechtigung ggf. manuell ändern kann.
  } else {
    // Status ist 'default', der Nutzer wurde noch nicht gefragt oder hat die Anfrage ignoriert.
    // Man könnte hier erneut um Erlaubnis bitten, aber das sollte kontrolliert geschehen.
    console.info('Benachrichtigungsberechtigung wurde noch nicht erteilt oder ignoriert.');
  }
};

// Beispiel für eine erweiterte Funktion, die erst um Erlaubnis fragt, falls nötig
export const notify = async (title: string, options?: NotificationOptions): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.warn('Dieser Browser unterstützt keine Desktop-Benachrichtigungen.');
    return false;
  }

  let permission = Notification.permission;

  if (permission === 'default') {
    permission = await requestNotificationPermission();
  }

  if (permission === 'granted') {
    // eslint-disable-next-line no-new
    new Notification(title, options);
    return true;
  }
  
  if (permission === 'denied') {
    console.info('Benachrichtigungsberechtigung wurde verweigert. Benachrichtigung nicht gesendet.');
  } else {
    console.info('Benachrichtigungsberechtigung nicht erteilt. Benachrichtigung nicht gesendet.');
  }
  return false;
}; 