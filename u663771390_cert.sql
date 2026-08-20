-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: Aug 22, 2025 at 12:24 PM
-- Server version: 10.11.10-MariaDB-log
-- PHP Version: 7.2.34

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `u663771390_cert`
--

-- --------------------------------------------------------

--
-- Table structure for table `admin`
--

CREATE TABLE `admin` (
  `id` int(11) NOT NULL,
  `username` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `admin`
--

INSERT INTO `admin` (`id`, `username`, `password`) VALUES
(1, 'admin', '123456');

-- --------------------------------------------------------

--
-- Table structure for table `settings`
--

CREATE TABLE `settings` (
  `id` int(11) NOT NULL,
  `sitename` varchar(255) NOT NULL,
  `site_title` varchar(255) NOT NULL,
  `site_url` varchar(255) NOT NULL,
  `track_prefix` varchar(255) NOT NULL,
  `track_num` varchar(255) NOT NULL,
  `invoice_terms` text NOT NULL,
  `allow_print` enum('Yes','No','','') NOT NULL,
  `show_map` enum('Yes','No','','') NOT NULL,
  `email_name` varchar(255) NOT NULL,
  `email_address` varchar(255) NOT NULL,
  `mail_track_update` enum('Yes','No','','') NOT NULL,
  `mail_track_save` enum('Yes','No','','') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `settings`
--

INSERT INTO `settings` (`id`, `sitename`, `site_title`, `site_url`, `track_prefix`, `track_num`, `invoice_terms`, `allow_print`, `show_map`, `email_name`, `email_address`, `mail_track_update`, `mail_track_save`) VALUES
(1, 'Oud Technologies', 'Certification', 'https://www.cert.transacksy.com', 'N251', '6', 'terms', 'Yes', 'Yes', 'OudTech Certification', 'davejnr.sitecreation@gmail.com', 'No', 'Yes');

-- --------------------------------------------------------

--
-- Table structure for table `tracking`
--

CREATE TABLE `tracking` (
  `id` int(11) NOT NULL,
  `tracking_number` varchar(255) NOT NULL,
  `sender_name` varchar(255) NOT NULL,
  `sender_contact` varchar(255) NOT NULL,
  `sender_email` varchar(255) NOT NULL,
  `sender_address` varchar(255) NOT NULL,
  `status` varchar(255) NOT NULL,
  `dispatch_location` varchar(255) NOT NULL,
  `receiver_email` varchar(255) NOT NULL,
  `receiver_name` varchar(255) NOT NULL,
  `receiver_contact` varchar(255) NOT NULL,
  `receiver_address` varchar(255) NOT NULL,
  `dispatch_date` varchar(255) NOT NULL,
  `delivery_date` varchar(255) NOT NULL,
  `pdesc` varchar(255) NOT NULL,
  `destination` varchar(255) NOT NULL,
  `current_location` varchar(255) DEFAULT NULL,
  `carrier` varchar(255) NOT NULL,
  `carrier_ref` varchar(255) NOT NULL,
  `ship_mode` varchar(255) NOT NULL,
  `weight` varchar(255) NOT NULL,
  `quantity` varchar(255) NOT NULL,
  `payment_mode` varchar(255) NOT NULL,
  `image` varchar(255) NOT NULL,
  `delivery_time` varchar(255) NOT NULL,
  `date` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tracking`
--

INSERT INTO `tracking` (`id`, `tracking_number`, `sender_name`, `sender_contact`, `sender_email`, `sender_address`, `status`, `dispatch_location`, `receiver_email`, `receiver_name`, `receiver_contact`, `receiver_address`, `dispatch_date`, `delivery_date`, `pdesc`, `destination`, `current_location`, `carrier`, `carrier_ref`, `ship_mode`, `weight`, `quantity`, `payment_mode`, `image`, `delivery_time`, `date`) VALUES
(12, 'N251-08-640935', '', '', '', '', 'Node 25.1', '', 'thankgodogbonna@gmail.com', 'ThankGod Ogbonna', '07065709106', '', '2025-08-03', '', 'Active in class &amp; Punctual', '', NULL, '', '', '', '', '', '', 'N251-08-640935.png', '', '2025-08-22 10:46:28'),
(13, 'N251-08-076982', '', '', '', '', 'Node 25.1', '', 'davejnr.sitecreation@gmail.com', 'Dave Junior', '0987666666', '', '2025-08-02', '', 'Intermediate Level', '', 'jh', '', '', '', '', '', '', 'N251-08-076982.png', '', '2025-08-22 10:54:07');

-- --------------------------------------------------------

--
-- Table structure for table `track_update`
--

CREATE TABLE `track_update` (
  `id` int(11) NOT NULL,
  `track_num` varchar(255) NOT NULL,
  `status` varchar(255) NOT NULL,
  `date` varchar(255) NOT NULL,
  `time` varchar(255) NOT NULL,
  `note` varchar(255) NOT NULL,
  `current_location` varchar(255) NOT NULL,
  `updated_at` datetime NOT NULL DEFAULT current_timestamp(),
  `delivery_charge` varchar(255) DEFAULT NULL,
  `total_charge` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `track_update`
--

INSERT INTO `track_update` (`id`, `track_num`, `status`, `date`, `time`, `note`, `current_location`, `updated_at`, `delivery_charge`, `total_charge`) VALUES
(7, 'CC-09-930241', 'Departed', '2023-09-14', '10:00', 'Please make payment before delivery', 'Albania', '2023-09-15 16:49:12', '25000', '25000'),
(8, 'CC-09-930241', 'Active', '2023-09-14', '12:00', 'Package just left airport', 'Guinea Bisau', '2023-09-15 16:51:08', '25000', '25000'),
(9, 'CC-09-930241', 'Arrived', '2023-09-15', '12:00', 'Arrived ready for pickup', 'Rwanda', '2023-09-15 16:59:21', '25000', '25000'),
(10, 'CC-09-930241', 'Inactive', '2023-09-15', '10:00', 'Waiting for payment transfer', 'Rwanda', '2023-09-15 17:00:43', '25000', '25000'),
(11, 'CC-09-930241', 'Picked Up', '2023-09-15', '03:00', 'Paid in full', 'Rwanda', '2023-09-15 17:02:31', '25000', '25000'),
(18, 'N251-08-076982', 'Picked Up', '2025-08-01', '11:23', 'Attentive', 'jh', '2025-08-22 11:23:49', '', ''),
(19, '', 'Node 25.1', '2025-08-01', '', '', '', '2025-08-22 11:26:29', '', ''),
(20, '', 'Node 25.1', '2025-08-01', '', '', '', '2025-08-22 11:26:51', '', '');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admin`
--
ALTER TABLE `admin`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `settings`
--
ALTER TABLE `settings`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `tracking`
--
ALTER TABLE `tracking`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `track_update`
--
ALTER TABLE `track_update`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `admin`
--
ALTER TABLE `admin`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `settings`
--
ALTER TABLE `settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `tracking`
--
ALTER TABLE `tracking`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `track_update`
--
ALTER TABLE `track_update`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
