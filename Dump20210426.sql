-- MySQL dump 10.13  Distrib 8.0.22, for Linux (x86_64)
--
-- Host: videostream.fidodarts.com    Database: videostream_db
-- ------------------------------------------------------
-- Server version	5.7.33-0ubuntu0.18.04.1

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `iteam_chanel`
--

DROP TABLE IF EXISTS `iteam_chanel`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `iteam_chanel` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `room_id` int(11) NOT NULL,
  `chanel` int(2) NOT NULL,
  `status` int(1) NOT NULL DEFAULT '1',
  `pi_id` int(11) NOT NULL,
  `usb_id` int(1) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `room_id` (`room_id`),
  KEY `pi_id` (`pi_id`),
  KEY `chanel` (`room_id`,`chanel`),
  KEY `usb_id` (`pi_id`,`usb_id`)
) ENGINE=InnoDB AUTO_INCREMENT=93 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `iteam_chanel`
--

LOCK TABLES `iteam_chanel` WRITE;
/*!40000 ALTER TABLE `iteam_chanel` DISABLE KEYS */;
INSERT INTO `iteam_chanel` VALUES (66,2,3,1,3,2),(71,2,4,1,3,1),(74,2,2,1,2,3),(75,2,5,1,2,2),(83,3,1,1,2,3),(84,3,2,1,3,3),(85,3,3,1,2,2),(86,3,5,1,3,2),(87,3,4,1,3,1),(89,2,1,1,3,3),(90,4,1,1,2,3),(91,4,2,1,3,3),(92,4,3,1,2,2);
/*!40000 ALTER TABLE `iteam_chanel` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `iteam_connect_pi`
--

DROP TABLE IF EXISTS `iteam_connect_pi`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `iteam_connect_pi` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `pi_id` int(11) NOT NULL,
  `sid` varchar(25) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` tinyint(4) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `sid_UNIQUE` (`sid`),
  KEY `pi_id` (`pi_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `iteam_connect_pi`
--

LOCK TABLES `iteam_connect_pi` WRITE;
/*!40000 ALTER TABLE `iteam_connect_pi` DISABLE KEYS */;
INSERT INTO `iteam_connect_pi` VALUES (1,3,'l97LUTN2owKbSbOdAAAX',1),(2,2,'3ZPxJtqO-w7G-QWyAAAh',1);
/*!40000 ALTER TABLE `iteam_connect_pi` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `iteam_connect_view`
--

DROP TABLE IF EXISTS `iteam_connect_view`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `iteam_connect_view` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `room_id` int(11) NOT NULL,
  `sid` varchar(25) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `room` (`room_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `iteam_connect_view`
--

LOCK TABLES `iteam_connect_view` WRITE;
/*!40000 ALTER TABLE `iteam_connect_view` DISABLE KEYS */;
/*!40000 ALTER TABLE `iteam_connect_view` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `iteam_pi`
--

DROP TABLE IF EXISTS `iteam_pi`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `iteam_pi` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `mac` varchar(17) COLLATE utf8mb4_unicode_ci NOT NULL,
  `no` varchar(15) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `createTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updateTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `mac_UNIQUE` (`mac`),
  UNIQUE KEY `no_UNIQUE` (`no`),
  KEY `mac` (`mac`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `iteam_pi`
--

LOCK TABLES `iteam_pi` WRITE;
/*!40000 ALTER TABLE `iteam_pi` DISABLE KEYS */;
INSERT INTO `iteam_pi` VALUES (1,'dc:a6:32:b8:8a:15','v-2h6v4xyf0j','JP-00001','2021-03-26 08:04:58','2021-03-26 09:36:54'),(2,'dc:a6:32:95:36:74','v-8vlh0jmbsg','JP-00002','2021-03-26 08:09:38','2021-04-25 03:16:45'),(3,'dc:a6:32:2c:df:80','','JP-00003','2021-04-21 03:10:46','2021-04-21 03:10:46');
/*!40000 ALTER TABLE `iteam_pi` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `iteam_port_used`
--

DROP TABLE IF EXISTS `iteam_port_used`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `iteam_port_used` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `pi_id` int(11) NOT NULL,
  `usb_id` int(1) NOT NULL,
  `port_no` int(11) NOT NULL,
  `dev_name` varchar(300) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `port_name` varchar(12) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `type` int(1) DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `port_no_UNIQUE` (`port_no`),
  KEY `pi_id` (`pi_id`,`usb_id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `iteam_port_used`
--

LOCK TABLES `iteam_port_used` WRITE;
/*!40000 ALTER TABLE `iteam_port_used` DISABLE KEYS */;
INSERT INTO `iteam_port_used` VALUES (1,3,1,55000,'USB Video: USB Video','/dev/video0',1),(2,3,2,55002,'HD Pro Webcam C920','/dev/video2',2),(3,3,3,55004,'C922 Pro Stream Webcam','/dev/video4',2),(4,3,4,55006,NULL,NULL,1),(5,2,1,55008,NULL,NULL,1),(6,2,2,55010,'HD Pro Webcam C920','/dev/video0',2),(7,2,3,55012,'HD Pro Webcam C920','/dev/video2',2),(8,2,4,55014,NULL,NULL,1);
/*!40000 ALTER TABLE `iteam_port_used` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `iteam_room`
--

DROP TABLE IF EXISTS `iteam_room`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `iteam_room` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `no` varchar(11) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` int(2) NOT NULL,
  `createTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updateTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `no` (`no`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `iteam_room`
--

LOCK TABLES `iteam_room` WRITE;
/*!40000 ALTER TABLE `iteam_room` DISABLE KEYS */;
INSERT INTO `iteam_room` VALUES (1,'1udpcj2d8cv','AAAA',4,'2021-04-09 05:47:16','2021-04-26 06:02:26'),(2,'8vlhketxo2','BBBB',5,'2021-04-09 05:50:58','2021-04-25 04:02:45'),(3,'1jg8q8t7ix4','CCCC',5,'2021-04-26 06:15:25','2021-04-26 06:15:46'),(4,'3r9tjh9uax','DDDD',5,'2021-04-26 06:45:41','2021-04-26 06:45:53');
/*!40000 ALTER TABLE `iteam_room` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `iteam_user`
--

DROP TABLE IF EXISTS `iteam_user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `iteam_user` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `no` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(45) COLLATE utf8mb4_unicode_ci NOT NULL,
  `psd` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `createTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updateTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `no_UNIQUE` (`no`),
  UNIQUE KEY `name_UNIQUE` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `iteam_user`
--

LOCK TABLES `iteam_user` WRITE;
/*!40000 ALTER TABLE `iteam_user` DISABLE KEYS */;
/*!40000 ALTER TABLE `iteam_user` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping events for database 'videostream_db'
--

--
-- Dumping routines for database 'videostream_db'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2021-04-26 14:51:40
