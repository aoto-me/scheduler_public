SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;


CREATE TABLE `dataTable` (
  `id` int NOT NULL,
  `user` int NOT NULL,
  `page` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `postId` int NOT NULL,
  `columnData` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `rowData` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `plainText` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `width` int NOT NULL DEFAULT '0',
  `height` int NOT NULL DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `diaryCard` (
  `id` int NOT NULL,
  `user` int NOT NULL,
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `date` date NOT NULL,
  `content` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `plainText` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `updated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `diaryItem` (
  `id` int NOT NULL,
  `user` int NOT NULL,
  `cardId` int NOT NULL,
  `sort` int NOT NULL,
  `file` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `expenseCategory` (
  `id` int NOT NULL,
  `user` int NOT NULL,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `icon` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `food` (
  `id` int NOT NULL,
  `user` int NOT NULL,
  `date` date NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity` float NOT NULL,
  `unit` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'g',
  `energy` float NOT NULL,
  `protein` float DEFAULT NULL,
  `fat` float DEFAULT NULL,
  `carb` float DEFAULT NULL,
  `salt` float DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `foodDB` (
  `id` int NOT NULL,
  `user` int NOT NULL,
  `name` varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `perItem` int NOT NULL DEFAULT '0',
  `energy` float NOT NULL,
  `protein` float DEFAULT NULL,
  `fat` float DEFAULT NULL,
  `carb` float DEFAULT NULL,
  `salt` float DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `foodDB_standard` (
  `id` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `perItem` tinyint(1) NOT NULL DEFAULT '0',
  `energy` decimal(10,1) NOT NULL,
  `protein` decimal(10,1) DEFAULT NULL,
  `fat` decimal(10,1) DEFAULT NULL,
  `carb` decimal(10,1) DEFAULT NULL,
  `salt` decimal(10,1) DEFAULT NULL,
  `aliases` varchar(255) NOT NULL,
  `keywords` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `gallery` (
  `id` int NOT NULL,
  `user` int NOT NULL,
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '新規ギャラリーページ',
  `type` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'unselect',
  `updated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `galleryCard` (
  `id` int NOT NULL,
  `user` int NOT NULL,
  `galleryId` int NOT NULL,
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `date` date DEFAULT NULL,
  `content` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `plainText` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `sort` int NOT NULL,
  `updated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `galleryFolder` (
  `id` int NOT NULL,
  `user` int NOT NULL,
  `folderId` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '新規フォルダ',
  `parentFolderId` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sort` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `galleryItem` (
  `id` int NOT NULL,
  `user` int NOT NULL,
  `galleryId` int NOT NULL,
  `cardId` int DEFAULT NULL,
  `sort` int NOT NULL,
  `file` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `galleryOrder` (
  `id` int NOT NULL,
  `user` int NOT NULL,
  `itemId` int NOT NULL,
  `folderId` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `sort` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `health` (
  `id` int NOT NULL,
  `user` int NOT NULL,
  `date` date NOT NULL,
  `other` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `mental` int NOT NULL,
  `exercise` int NOT NULL DEFAULT '0',
  `memo` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `healthCategory` (
  `id` int NOT NULL,
  `user` int NOT NULL,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `icon` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `healthItem` (
  `id` int NOT NULL,
  `user` int NOT NULL,
  `healthId` int NOT NULL,
  `categoryId` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `incomeCategory` (
  `id` int NOT NULL,
  `user` int NOT NULL,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `icon` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `memo` (
  `id` int NOT NULL,
  `user` int NOT NULL,
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '新規メモページ',
  `content` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `plainText` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `updated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `memoFolder` (
  `id` int NOT NULL,
  `user` int NOT NULL,
  `folderId` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '新規フォルダ',
  `parentFolderId` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sort` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `memoOrder` (
  `id` int NOT NULL,
  `user` int NOT NULL,
  `itemId` int NOT NULL,
  `folderId` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `sort` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `money` (
  `id` int NOT NULL,
  `user` int NOT NULL,
  `date` date NOT NULL,
  `type` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` int NOT NULL,
  `amount` int NOT NULL,
  `content` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `monthlyMemo` (
  `id` int NOT NULL,
  `user` int NOT NULL,
  `date` date NOT NULL,
  `memo` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `nutrition` (
  `id` int NOT NULL,
  `user` int NOT NULL,
  `energy` float NOT NULL,
  `protein` float NOT NULL,
  `fat` float NOT NULL,
  `carb` float NOT NULL,
  `salt` float NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `project` (
  `id` int NOT NULL,
  `user` int NOT NULL,
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '新規プロジェクトページ',
  `end` date DEFAULT NULL,
  `content` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `plainText` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `updated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `projectFolder` (
  `id` int NOT NULL,
  `user` int NOT NULL,
  `folderId` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '新規フォルダ',
  `parentFolderId` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sort` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `projectOrder` (
  `id` int NOT NULL,
  `user` int NOT NULL,
  `itemId` int NOT NULL,
  `folderId` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `sort` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `rss` (
  `id` int NOT NULL,
  `user` int NOT NULL,
  `url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `siteName` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `section` (
  `id` int NOT NULL,
  `user` int NOT NULL,
  `sectionId` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `projectId` int NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '新規セクション',
  `sort` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `taskTime` (
  `id` int NOT NULL,
  `user` int NOT NULL,
  `todoId` int NOT NULL,
  `start` datetime DEFAULT NULL,
  `end` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `todo` (
  `id` int NOT NULL,
  `user` int NOT NULL,
  `content` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `start` datetime NOT NULL,
  `end` datetime DEFAULT NULL,
  `type` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `projectId` int DEFAULT NULL,
  `sectionId` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `estimated` time DEFAULT NULL,
  `completed` int NOT NULL DEFAULT '0',
  `visible` int NOT NULL DEFAULT '1',
  `memo` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `sort` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `user` (
  `id` int NOT NULL,
  `userName` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `mail` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `private` int NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `userDevice` (
  `id` int NOT NULL,
  `user` int NOT NULL,
  `deviceId` varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `userIP` (
  `id` int NOT NULL,
  `ip` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `count` int NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `yearEvent` (
  `id` int NOT NULL,
  `user` int NOT NULL,
  `date` date NOT NULL,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


ALTER TABLE `dataTable`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_dataTable_user_id` (`user`);

ALTER TABLE `diaryCard`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_diaryCard_user_date` (`user`,`date`);

ALTER TABLE `diaryItem`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_diaryItem_diaryCard_id` (`cardId`),
  ADD KEY `fk_diaryItem_user_id` (`user`);

ALTER TABLE `expenseCategory`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_expenseCategory_user_id` (`user`);

ALTER TABLE `food`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_food_user_id` (`user`);

ALTER TABLE `foodDB`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_foodDB_user_id` (`user`);

ALTER TABLE `foodDB_standard`
  ADD PRIMARY KEY (`id`);

ALTER TABLE `gallery`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_gallery_user_id` (`user`);

ALTER TABLE `galleryCard`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_galleryCard_gallery_id` (`galleryId`),
  ADD KEY `fk_galleryCard_user_id` (`user`);

ALTER TABLE `galleryFolder`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_galleryFolder_user_id` (`user`);

ALTER TABLE `galleryItem`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_galleryItem_gallery_id` (`galleryId`),
  ADD KEY `fk_galleryItem_user_id` (`user`),
  ADD KEY `fk_galleryItem_galleryCard_id` (`cardId`);

ALTER TABLE `galleryOrder`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_galleryOrder_user_id` (`user`),
  ADD KEY `fk_galleryOrder_gallery_id` (`itemId`);

ALTER TABLE `health`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_health_user_date` (`user`,`date`);

ALTER TABLE `healthCategory`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_healthCategory_user_id` (`user`);

ALTER TABLE `healthItem`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_healthItem_health_id` (`healthId`),
  ADD KEY `fk_healthItem_healthCategory_id` (`categoryId`),
  ADD KEY `fk_healthItem_user_id` (`user`);

ALTER TABLE `incomeCategory`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_incomeCategory_user_id` (`user`);

ALTER TABLE `memo`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_memo_user_id` (`user`);

ALTER TABLE `memoFolder`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_memoFolder_user_id` (`user`);

ALTER TABLE `memoOrder`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_memoOrder_user_id` (`user`),
  ADD KEY `fk_memoOrder_memo_id` (`itemId`);

ALTER TABLE `money`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_money_user_id` (`user`);

ALTER TABLE `monthlyMemo`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_monthlyMemo_user_id` (`user`);

ALTER TABLE `nutrition`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user` (`user`);

ALTER TABLE `project`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_project_user_id` (`user`);

ALTER TABLE `projectFolder`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_projectFolder_user_id` (`user`);

ALTER TABLE `projectOrder`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_projectOrder_user_id` (`user`),
  ADD KEY `fk_projectOrder_project_id` (`itemId`);

ALTER TABLE `rss`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_rss_user_id` (`user`);

ALTER TABLE `section`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_section_project_id` (`projectId`),
  ADD KEY `fk_section_user_id` (`user`);

ALTER TABLE `taskTime`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_taskTime_user_id` (`user`),
  ADD KEY `fk_taskTime_todo_id` (`todoId`);

ALTER TABLE `todo`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_todo_user_id` (`user`),
  ADD KEY `fk_todo_project_id` (`projectId`);

ALTER TABLE `user`
  ADD PRIMARY KEY (`id`);

ALTER TABLE `userDevice`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `deviceId` (`deviceId`),
  ADD KEY `fk_userDevice_user_id` (`user`);

ALTER TABLE `userIP`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `ip` (`ip`);

ALTER TABLE `yearEvent`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_yearEvent_user_id` (`user`);


ALTER TABLE `dataTable`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

ALTER TABLE `diaryCard`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

ALTER TABLE `diaryItem`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

ALTER TABLE `expenseCategory`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

ALTER TABLE `food`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

ALTER TABLE `foodDB`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

ALTER TABLE `gallery`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

ALTER TABLE `galleryCard`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

ALTER TABLE `galleryFolder`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

ALTER TABLE `galleryItem`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

ALTER TABLE `galleryOrder`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

ALTER TABLE `health`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

ALTER TABLE `healthCategory`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

ALTER TABLE `healthItem`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

ALTER TABLE `incomeCategory`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

ALTER TABLE `memo`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

ALTER TABLE `memoFolder`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

ALTER TABLE `memoOrder`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

ALTER TABLE `money`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

ALTER TABLE `monthlyMemo`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

ALTER TABLE `nutrition`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

ALTER TABLE `project`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

ALTER TABLE `projectFolder`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

ALTER TABLE `projectOrder`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

ALTER TABLE `rss`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

ALTER TABLE `section`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

ALTER TABLE `taskTime`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

ALTER TABLE `todo`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

ALTER TABLE `user`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

ALTER TABLE `userDevice`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

ALTER TABLE `userIP`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

ALTER TABLE `yearEvent`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;


ALTER TABLE `dataTable`
  ADD CONSTRAINT `fk_dataTable_user_id` FOREIGN KEY (`user`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `diaryCard`
  ADD CONSTRAINT `fk_diaryCard_user_id` FOREIGN KEY (`user`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `diaryItem`
  ADD CONSTRAINT `fk_diaryItem_diaryCard_id` FOREIGN KEY (`cardId`) REFERENCES `diaryCard` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_diaryItem_user_id` FOREIGN KEY (`user`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `expenseCategory`
  ADD CONSTRAINT `fk_expenseCategory_user_id` FOREIGN KEY (`user`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `food`
  ADD CONSTRAINT `fk_food_user_id` FOREIGN KEY (`user`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `foodDB`
  ADD CONSTRAINT `fk_foodDB_user_id` FOREIGN KEY (`user`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `gallery`
  ADD CONSTRAINT `fk_gallery_user_id` FOREIGN KEY (`user`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `galleryCard`
  ADD CONSTRAINT `fk_galleryCard_gallery_id` FOREIGN KEY (`galleryId`) REFERENCES `gallery` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_galleryCard_user_id` FOREIGN KEY (`user`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `galleryFolder`
  ADD CONSTRAINT `fk_galleryFolder_user_id` FOREIGN KEY (`user`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `galleryItem`
  ADD CONSTRAINT `fk_galleryItem_gallery_id` FOREIGN KEY (`galleryId`) REFERENCES `gallery` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_galleryItem_galleryCard_id` FOREIGN KEY (`cardId`) REFERENCES `galleryCard` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_galleryItem_user_id` FOREIGN KEY (`user`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `galleryOrder`
  ADD CONSTRAINT `fk_galleryOrder_gallery_id` FOREIGN KEY (`itemId`) REFERENCES `gallery` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_galleryOrder_user_id` FOREIGN KEY (`user`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `health`
  ADD CONSTRAINT `fk_health_user_id` FOREIGN KEY (`user`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `healthCategory`
  ADD CONSTRAINT `fk_healthCategory_user_id` FOREIGN KEY (`user`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `healthItem`
  ADD CONSTRAINT `fk_healthItem_health_id` FOREIGN KEY (`healthId`) REFERENCES `health` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_healthItem_healthCategory_id` FOREIGN KEY (`categoryId`) REFERENCES `healthCategory` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_healthItem_user_id` FOREIGN KEY (`user`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `incomeCategory`
  ADD CONSTRAINT `fk_incomeCategory_user_id` FOREIGN KEY (`user`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `memo`
  ADD CONSTRAINT `fk_memo_user_id` FOREIGN KEY (`user`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `memoFolder`
  ADD CONSTRAINT `fk_memoFolder_user_id` FOREIGN KEY (`user`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `memoOrder`
  ADD CONSTRAINT `fk_memoOrder_memo_id` FOREIGN KEY (`itemId`) REFERENCES `memo` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_memoOrder_user_id` FOREIGN KEY (`user`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `money`
  ADD CONSTRAINT `fk_money_user_id` FOREIGN KEY (`user`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `monthlyMemo`
  ADD CONSTRAINT `fk_monthlyMemo_user_id` FOREIGN KEY (`user`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `nutrition`
  ADD CONSTRAINT `fk_nutrition_user_id` FOREIGN KEY (`user`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `project`
  ADD CONSTRAINT `fk_project_user_id` FOREIGN KEY (`user`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `projectFolder`
  ADD CONSTRAINT `fk_projectFolder_user_id` FOREIGN KEY (`user`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `projectOrder`
  ADD CONSTRAINT `fk_projectOrder_project_id` FOREIGN KEY (`itemId`) REFERENCES `project` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_projectOrder_user_id` FOREIGN KEY (`user`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `rss`
  ADD CONSTRAINT `fk_rss_user_id` FOREIGN KEY (`user`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `section`
  ADD CONSTRAINT `fk_section_project_id` FOREIGN KEY (`projectId`) REFERENCES `project` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_section_user_id` FOREIGN KEY (`user`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `taskTime`
  ADD CONSTRAINT `fk_taskTime_todo_id` FOREIGN KEY (`todoId`) REFERENCES `todo` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_taskTime_user_id` FOREIGN KEY (`user`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `todo`
  ADD CONSTRAINT `fk_todo_project_id` FOREIGN KEY (`projectId`) REFERENCES `project` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_todo_user_id` FOREIGN KEY (`user`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `userDevice`
  ADD CONSTRAINT `fk_userDevice_user_id` FOREIGN KEY (`user`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `yearEvent`
  ADD CONSTRAINT `fk_yearEvent_user_id` FOREIGN KEY (`user`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
