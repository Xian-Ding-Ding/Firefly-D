import type { AnnouncementConfig } from "../types/announcementConfig";

export const announcementConfig: AnnouncementConfig = {
	// 公告标题
	title: "公告",

	// 公告内容
	content:
		"这里会持续整理化学工程专业课(如化工原理、反应工程、物理化学、传递过程、分离工程等)、计算化学(Gaussian、VASP、ms等)和机器学习(XGBoost、CNN、Transfomer等)相关笔记。",

	// 是否允许用户关闭公告
	closable: true,

	link: {
		// 启用链接
		enable: true,
		// 链接文本
		text: "进入学习库",
		// 链接 URL
		url: "/notes/",
		// 内部链接
		external: false,
	},
};
