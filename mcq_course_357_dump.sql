-- MySQL dump 10.13  Distrib 9.4.0, for Linux (aarch64)
--
-- Host: localhost    Database: spacedrevision
-- ------------------------------------------------------
-- Server version	9.4.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `mcq`
--

DROP TABLE IF EXISTS `mcq`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mcq` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `course_id` int DEFAULT NULL,
  `subject_id` int DEFAULT NULL,
  `topic_id` int DEFAULT NULL,
  `question` text NOT NULL,
  `option1` text NOT NULL,
  `option2` text NOT NULL,
  `option3` text NOT NULL,
  `option4` text NOT NULL,
  `answer` int NOT NULL,
  `explain1` text NOT NULL,
  `explain2` text NOT NULL,
  `explain3` text NOT NULL,
  `explain4` text NOT NULL,
  `exam_body_id` int NOT NULL,
  `exam_name_id` int NOT NULL,
  `exam_year` int NOT NULL,
  `level` int NOT NULL DEFAULT '1200',
  `date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `note_id` int DEFAULT NULL,
  `practice_id` int DEFAULT NULL,
  `hide` tinyint(1) DEFAULT '0',
  `youtube` varchar(255) DEFAULT NULL,
  `stage` enum('Basic','Intermediate','Advanced') NOT NULL DEFAULT 'Basic',
  `subject_tag_id` int DEFAULT NULL,
  `topic_tag_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `fk_mcq_subject_id` (`subject_id`),
  KEY `fk_mcq_topic_id` (`topic_id`),
  KEY `fk_mcq_note_id` (`note_id`),
  KEY `idx_course_id` (`course_id`),
  CONSTRAINT `fk_mcq_course_id` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_mcq_note_id` FOREIGN KEY (`note_id`) REFERENCES `notesheading` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_mcq_subject_id` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_mcq_topic_id` FOREIGN KEY (`topic_id`) REFERENCES `topics` (`id`) ON DELETE SET NULL,
  CONSTRAINT `mcq_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=63329 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mcq`
--
-- WHERE:  course_id=357

LOCK TABLES `mcq` WRITE;
/*!40000 ALTER TABLE `mcq` DISABLE KEYS */;
INSERT INTO `mcq` VALUES (28994,41,357,333,365,'<p>Great Grandmother</p>','<p>Ajyo</p>','<p>Gong-nyo</p>','<p>Anyo</p>','<p>Gong-jyo</p>',1,'','','','',0,0,0,1204,'2025-09-01 07:13:00',NULL,NULL,0,NULL,'Basic',NULL,NULL),(28996,41,357,333,365,'<p>Great Grand-Father</p>','<p>Gong-jyo</p>','<p>Gong-nyo</p>','<p>Phami</p>','<p>Ajyo</p>',0,'','','','',0,0,0,1200,'2025-09-01 07:13:37',NULL,NULL,0,NULL,'Basic',NULL,NULL),(28997,41,357,333,365,'<p>Grandfather</p>','<p>Abhala</p>','<p>Amla</p>','<p>Anyo</p>','<p>Ajyo</p>',3,'','','','',0,0,0,1200,'2025-09-01 07:14:06',NULL,NULL,0,NULL,'Basic',NULL,NULL),(28999,41,357,333,365,'<p>Grandmother</p>','<p>Anyo</p>','<p>Amla</p>','<p>Gong-nyo</p>','<p>Ajyo</p>',0,'','','','',0,0,0,1200,'2025-09-01 07:14:36',NULL,NULL,0,NULL,'Basic',NULL,NULL),(29000,41,357,333,365,'<p>Father</p>','<p>Ajyo</p>','<p>Abhala</p>','<p>Aku</p>','<p>Phami</p>',1,'','','','',0,0,0,1200,'2025-09-01 07:15:00',NULL,NULL,0,NULL,'Basic',NULL,NULL),(29001,41,357,333,365,'<p>Mother</p>','<p>Anyola</p>','<p>Amla</p>','<p>Amchung</p>','<p>Aiela</p>',1,'','','','',0,0,0,1200,'2025-09-01 07:15:24',NULL,NULL,0,NULL,'Basic',NULL,NULL),(29002,41,357,333,365,'<p>Elder Sister</p>','<p>Phusim</p>','<p>Aie Gembo</p>','<p>Aie Chungbo</p>','<p>Phami</p>',1,'','','','',0,0,0,1200,'2025-09-01 07:16:07',NULL,NULL,0,NULL,'Basic',NULL,NULL),(29003,41,357,333,365,'<p>Elder Brother</p>','<p>Phami</p>','<p>Agya Gembo</p>','<p>Pinlho</p>','<p>Num Chungbo</p>',1,'','','','',0,0,0,1200,'2025-09-01 07:16:42',NULL,NULL,0,NULL,'Basic',NULL,NULL),(29004,41,357,333,365,'<p>Younger Sister</p>','<p>Pinlho</p>','<p>Phami</p>','<p>Num Chungbo</p>','<p>Aie Gembo</p>',2,'','','','',0,0,0,1200,'2025-09-01 07:17:32',NULL,NULL,0,NULL,'Basic',NULL,NULL),(29005,41,357,333,365,'<p>Girl\'s Younger Brother</p>','<p>Agya Gembo</p>','<p>Phami</p>','<p>Pinlho</p>','<p>Num Chungbo</p>',1,'','','','',0,0,0,1200,'2025-09-01 07:18:27',NULL,NULL,0,NULL,'Basic',NULL,NULL),(36226,11,357,333,359,'What is the Bhutia translation for the English greeting \'Good Morning\'?','Nyima Delek','Thopa Delek','Phisam Delek','Phiru Delek',2,'','','','',0,0,0,1200,'2025-11-13 12:53:22',NULL,NULL,0,NULL,'Basic',NULL,NULL),(36227,11,357,333,359,'How would you say \'Hello\' or \'Namaste\' in Bhutia?','Jonpa Legso','Kuzu Zangpo','Thopa Delek','Nyima Delek',2,'','','','',0,0,0,1200,'2025-11-13 12:53:28',NULL,NULL,0,NULL,'Basic',NULL,NULL),(36228,11,357,333,359,'In Bhutia, what does \'Jonpa Legso\' mean?','Welcome','Good Night','Good Evening','Good Morning',1,'','','','',0,0,0,1200,'2025-11-13 12:53:42',NULL,NULL,0,NULL,'Basic',NULL,NULL),(36229,11,357,333,359,'What is the correct Bhutia greeting for \'Good Evening\'?','Phiru Delek','Nyima Delek','Phisam Delek','Thopa Delek',3,'','','','',0,0,0,1200,'2025-11-13 12:53:51',NULL,NULL,0,NULL,'Basic',NULL,NULL),(36230,11,357,333,359,'Which of the following is the Bhutia phrase for \'Good Night\'?','Thopa Delek','Phisam Delek','Jonpa Legso','Phiru Delek',4,'','','','',0,0,0,1200,'2025-11-13 12:54:15',NULL,NULL,0,NULL,'Basic',NULL,NULL);
/*!40000 ALTER TABLE `mcq` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-03  5:45:34
