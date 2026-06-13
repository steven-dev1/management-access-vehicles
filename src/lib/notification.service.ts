let Notifications: any = null;

async function getNotifications(): Promise<any> {
  if (Notifications) return Notifications;
  try {
    const mod = await import('expo-notifications' as any);
    Notifications = mod;
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
    return Notifications;
  } catch {
    return null;
  }
}

export const notificationService = {
  async requestPermissions(): Promise<boolean> {
    const N = await getNotifications();
    if (!N) return false;
    try {
      const { status } = await N.requestPermissionsAsync();
      return status === 'granted';
    } catch {
      return false;
    }
  },

  async registerForPushNotifications(): Promise<string | null> {
    const N = await getNotifications();
    if (!N) return null;
    try {
      const token = await N.getExpoPushTokenAsync();
      return token.data;
    } catch {
      return null;
    }
  },

  async scheduleLocalNotification(title: string, body: string, data?: object): Promise<void> {
    const N = await getNotifications();
    if (!N) return;
    try {
      await N.scheduleNotificationAsync({
        content: { title, body, data: data || {} },
        trigger: null,
      });
    } catch {}
  },

  async scheduleVisitorArrival(visitorName: string, plate: string, tower: number, apartment: string): Promise<void> {
    await this.scheduleLocalNotification(
      'Visitante llegando',
      `${visitorName} (${plate}) se dirige a Torre ${tower} - ${apartment}`,
      { type: 'visitor_arrival', plate, tower, apartment }
    );
  },

  async scheduleParkingAlert(plate: string, ownerName: string, daysParked: number): Promise<void> {
    await this.scheduleLocalNotification(
      'Vehículo estacionado mucho tiempo',
      `${plate} (${ownerName}) lleva ${daysParked} días estacionado`,
      { type: 'parking_alert', plate, daysParked }
    );
  },

  async scheduleExpiringVisitor(visitorName: string, plate: string, hoursLeft: number): Promise<void> {
    await this.scheduleLocalNotification(
      'Visitante por vencer',
      `La visita de ${visitorName} (${plate}) vence en ${hoursLeft} horas`,
      { type: 'visitor_expiring', plate, hoursLeft }
    );
  },

  async configureNotificationHandler(): Promise<void> {
    const N = await getNotifications();
    if (!N) return;
    N.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  },
};
