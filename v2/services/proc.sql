CREATE DEFINER=`remote`@`%` PROCEDURE `sp_DeleteCoreUser_v2`(IN userId int)
BEGIN
    DECLARE isForumAdmin INT DEFAULT 0;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION 
        BEGIN
            ROLLBACK;
            RESIGNAL;
        END;
    START TRANSACTION;
        SET SQL_SAFE_UPDATES = 0;
        
SELECT 
    COUNT(*)
INTO isForumAdmin FROM
    forum_members
WHERE
    userId = userId AND isAdmin = 1;
        
DELETE FROM user_cityuser_mapping 
WHERE
    userId = userId;
DELETE FROM user_listing_mapping 
WHERE
    userId = userId;
DELETE FROM refreshtokens 
WHERE
    userId = userId;
DELETE FROM forgot_password_tokens 
WHERE
    userId = userId;
DELETE FROM verification_tokens 
WHERE
    userId = userId;
DELETE FROM user_preference_cities 
WHERE
    userId = userId;
DELETE FROM user_preference_categories 
WHERE
    userId = userId;
DELETE FROM firebase_token 
WHERE
    userId = userId;
DELETE FROM favorites 
WHERE
    userId = userId;
DELETE FROM notification 
WHERE
    userId = userId;
DELETE FROM addresses 
WHERE
    userId = userId;
DELETE FROM defect_reports 
WHERE
    userId = userId;
        
        IF isForumAdmin > 0 THEN
            DELETE fp FROM forum_posts fp
            INNER JOIN forum_members fm ON fp.forumId = fm.forumId
            WHERE fm.userId = userId AND fm.isAdmin = 1;
            
DELETE fc FROM forum_comments fc
        INNER JOIN
    forum_members fm ON fc.forumId = fm.forumId 
WHERE
    fm.userId = userId AND fm.isAdmin = 1;
            
DELETE fr FROM forum_requests fr
        INNER JOIN
    forum_members fm ON fr.forumId = fm.forumId 
WHERE
    fm.userId = userId AND fm.isAdmin = 1;
            
DELETE fci FROM forum_cities fci
        INNER JOIN
    forum_members fm ON fci.forumId = fm.forumId 
WHERE
    fm.userId = userId AND fm.isAdmin = 1;
    
-- Step 1: Temporarily store the list of forums where the user is admin
CREATE TEMPORARY TABLE temp_admin_forums (forumId INT PRIMARY KEY);

INSERT INTO temp_admin_forums (forumId)
SELECT forumId
FROM forum_members
WHERE userId = userId AND isAdmin = 1;

            
DELETE fm_all FROM forum_members fm_all
JOIN (
    SELECT forumId FROM forum_members WHERE userId = userId AND isAdmin = 1
) AS admin_forums ON fm_all.forumId = admin_forums.forumId;
            
DELETE f
FROM forums f
JOIN temp_admin_forums taf ON f.id = taf.forumId;
            
-- Delete the admin user's own forum membership last
DELETE FROM forum_members 
WHERE
    userId = userId;
            
 -- Delete any remaining forum requests by this user (in forums they don't admin)
DELETE FROM forum_requests 
WHERE
    userId = userId;
        ELSE
            DELETE FROM forum_posts WHERE userId = userId;
DELETE FROM forum_comments 
WHERE
    userId = userId;
DELETE FROM forum_requests 
WHERE
    userId = userId;
DELETE FROM forum_members 
WHERE
    userId = userId;
        END IF;
        
        -- CASCADE will automatically delete forum_user_keys when user_keys are deleted
DELETE FROM user_keys 
WHERE
    userId = userId;
DELETE FROM users 
WHERE
    id = userId;
        
        SET SQL_SAFE_UPDATES = 1;
    COMMIT;
END