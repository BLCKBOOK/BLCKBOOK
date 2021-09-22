import { Notification, NotificationIndex } from "../../common/tableDefinitions";

export type getNotificationsPageRequestBody = { index: NotificationIndex, limit: number }

export type getNotificationsPageResponseBody = Notification[]