CREATE TABLE facts (factId int NOT NULL AUTO_INCREMENT,factHeading varchar(255) DEFAULT NULL,factDiscription text,imgsrc varchar(255) DEFAULT NULL,factContent text,video_url varchar(255) DEFAULT NULL,PRIMARY KEY (factId)); 
insert into facts (factHeading, factDiscription, imgsrc, factContent, video_url) values (
"How trees tranfer water up to the leaves?", 
"One of the fundamental problems trees have to solve is how to transport water up to the leaves. The ability to solve this problem poses a constraint on the maximum height of trees.",
"capilary.jpg", 
"Capillary action is the term for the ability of a narrow tube (a capillary) to draw liquid into itself via the adhesive force between the liquid 
and the tube walls. In plants, the relevant tubes are known as Xylem and the fluid is water. In trees, capillary action alone is not the only 
mechanism to transport water. First, without evaporation, capillary action would only transport water until mechanical equilibrium is reached 
and the flow stops. There’s also osmotic pressure at the roots drawing the water in from the soil. There are probably also osmotic effects 
throughout the tree itself.","HUjWvBcro1k");
create table user_data(user_id int not null auto_increment, user_name varchar(255), user_email varchar(255), user_pass varchar(255), user_sid varchar(255) default "NotLogedIn", reset_link varchar(255) default "notreset", primary key(user_id));
insert into user_data(user_name, user_email, user_pass) values ("admin", "admin@gmail.com", "asdfasdf");
create table ep_topic(topic_id int not null auto_increment, chapter_name varchar(255), topic_name varchar(255), topic_pdf varchar(255) default "/unitnotfound", topic_ppt varchar(255), topic_link varchar(255), notes_present varchar(255) default "false", primary key(topic_id));
insert into ep_topic(chapter_name, topic_name, topic_ppt, topic_link) values ("chaptername", "topicname","ppt.pdf", "scithon.com");
create table ec_topic(topic_id int not null auto_increment, chapter_name varchar(255), topic_name varchar(255), topic_pdf varchar(255) default "/unitnotfound", topic_ppt varchar(255), topic_link varchar(255), notes_present varchar(255) default "false", primary key(topic_id));
insert into ec_topic(chapter_name, topic_name, topic_ppt, topic_link) values ("chaptername", "topicname","ppt.pdf", "scithon.com");
create table em_topic(topic_id int not null auto_increment, chapter_name varchar(255), topic_name varchar(255), topic_pdf varchar(255) default "/unitnotfound", topic_ppt varchar(255), topic_link varchar(255), notes_present varchar(255) default "false", primary key(topic_id));
insert into em_topic(chapter_name, topic_name, topic_ppt, topic_link) values ("chaptername", "topicname","ppt.pdf", "scithon.com");
create table tp_topic(topic_id int not null auto_increment, chapter_name varchar(255), topic_name varchar(255), topic_pdf varchar(255) default "/unitnotfound", topic_ppt varchar(255), topic_link varchar(255), notes_present varchar(255) default "false", primary key(topic_id));
insert into tp_topic(chapter_name, topic_name, topic_ppt, topic_link) values ("chaptername", "topicname","ppt.pdf", "scithon.com");
create table tc_topic(topic_id int not null auto_increment, chapter_name varchar(255), topic_name varchar(255), topic_pdf varchar(255) default "/unitnotfound", topic_ppt varchar(255), topic_link varchar(255), notes_present varchar(255) default "false", primary key(topic_id));
insert into tc_topic(chapter_name, topic_name, topic_ppt, topic_link) values ("chaptername", "topicname","ppt.pdf", "scithon.com");
create table tm_topic(topic_id int not null auto_increment, chapter_name varchar(255), topic_name varchar(255), topic_pdf varchar(255) default "/unitnotfound", topic_ppt varchar(255), topic_link varchar(255), notes_present varchar(255) default "false", primary key(topic_id));
insert into tm_topic(chapter_name, topic_name, topic_ppt, topic_link) values ("chaptername", "topicname","ppt.pdf", "scithon.com");
