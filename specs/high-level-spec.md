# Angry Birdman Clan Management Tool

## 1. Purpose

Managing an Angry Birds 2 clan properly can be a very time-consuming task for clan administrators. The goal of Angry Birdman is to make life easier by providing an online, streamlined management system that enables clan admins to:

1. Manage the roster of players in a clan
2. Efficiently capture data from clan battles
3. Calculate statistics and performance rankings for each battle
4. Roll up data into monthly and yearly stats
5. Produce reports and other data visualizations
6. Manage administrative user accounts and roles

In addition to making life easier for clan administrators, the secondary goal is to make the game more fun and more competitive by providing a wealth of ways to visualize and track clan and individual performance.

## 2. Glossary of Key Concepts

### Angry Birds 2

Angry Birds 2 is a popular mobile game for iOS and Android that supports many different game modes, including competitive game modes where players are grouped into teams called **Clans** that are managed by privileged members of the team.

### Clans

In Angry Birds 2, clans can consist of up to 50 members. Clans can be **open**, meaning that anyone can join, or **closed**, meaning that someone must be invited to the clan to join. Clans are identified by their unique names.

### Clan Leader

There is a single player called the **Clan Leader** that is the owner of the clan. This player can promote and demote co-leaders, and can also kick players from the clan. This is the only player that can disband the clan.

### Clan Co-Leader

Multiple players can be promoted to the role of **Co-Leader**, which means they have administrative control which is limited to kicking players from the clan and promoting other players to **Co-Leader**.

### Clan-vs-Clan (CvC) Battle

A battle matches one clan against another using a matching system that is designed to produce competitive matchups. Individual clan members play the battle's game rooms and are awarded battle points based on their total score. The individual scores are added together, and the team with the most points is the winner. Ties can happen. Battles last for 2 days and there is one day between battles.

### Flock Power

Each player has a **Flock Power** which is a multiplier that is applied to all scoring within the game. The player grows their Flock Power, or just **FP**, as they play the game and upgrade their birds. A new player may have a FP of 50 while another player that has played for a decade could have a FP of 4,000.

### Ratio Score

A player's **Ratio Score** is the player's score divided by their current **FP**, with that ratio multiplied by 10 to put the ratio value on an approximate 100 point scale. This is used to rate the true performance of a player in a battle since flock power varies greatly amongst players.

## 3. User Personas

Several different types of users will need to access Angry Birdman. These user personas are defined below.

### Clan Admin

A **Clan Admin** can manage information for a single clan, and access management tools that are restricted to their clan. They can also promote other users to the **Clan Admin** role.

### Clan Owner

A **Clan Owner** can do everything that a **Clan Admin** can do, but can also remove users from the **Clan Admin** role and make the clan inactive in the system. Whoever registered the clan is the initial **Clan Owner**, but that person can transfer that role to another user.

### Superadmin

The **Superadmin** role is for users that need complete access and control. They can manage data and settings for all clans. There is no limit to their power!

### Anonymous (Includes Clan Members)

We are not providing individual user accounts to non-administrator members of a clan. They will just access the information like any other users. Battle data, analytics, and reporting for all clans will be available to all users. At a later date we may revisit this and support accounts for users so they can personalize their experience and interact with other users, but for now the data is open and the consumers are anonymous unless they are an admin.

## 4. User Experience Objectives

The user experience should be designed and engineered in a way to achieve the following objectives:

1. The user interfaces are clean, modern, and responsive so that Angry Birdman can be used across different types of devices.
2. The layout and presentation of information and controls is minimal and intuitive.
3. Data entry processes are efficient and take into account how Angry Birds 2 provides the information which needs to be provided to the system, allowing users to tab quickly between the fields that need entered in the same order that they are reading them from the game UI.
4. Common interface navigation can be done with keyboard shortcuts to promote mouse-free use.
5. Data entry processes are as efficient as possible even when using a device like a tablet or phone to capture data.
6. This is a management system for a fun game, and besides being efficient, it should try to be fun and lighthearted in its tone and visual design.

## 5. User Epics

Angry Birdman needs to support a broad range of usage scenarios. The following user epics have been identified at this time for an initial implementation, with some key user stories listed as context. Please note that a **Clan Owner** is a privileged type of **Clan Admin**. Accordingly, stories that apply to Clan Admins also apply to Clan Owners unless indicated otherwise. Similarly, the **Superadmin** can do anything that a **Clan Owner** or **Clan Admin** can do, but can do those things for any clan registered in the system.

### Epic 1: General and Navigation

Key Stories:

- Anonymous user visits the landing page
- Anonymous user uses standard website navigation menus
- Anonymous user navigates to clan-specific landing page
- Anonymous user uses clan-specific navigation menus to get to clan-specific information
- Clan Admin authenticates into the website
- Clan Admin makes use of a clan-specific admin menu to navigate admin features
- Anonymous user uses clan selector feature to view information on a specific clan
- Superadmin uses clan selector feature to select the clan they are currently managing

### Epic 2: User and Clan Management

Key Stories:

- Superadmin creates Superadmin account using an external IdP administrative interface
- Clan Admin self-registers for a new account
- Clan Owner self-registers a new clan
- Clan Owner promotes another admin user to owner
- Clan Admin edits user profile information
- Clan Owner edits clan profile information
- Clan Admin changes their password
- Clan Admin resets forgotten password
- Superadmin sets the password for a Clan Admin account
- Superadmin disables Clan Admin account

### Epic 3: Maintain Clan Roster

Key Stories:

- Clan Admin adds a new player to the roster
- Clan Admin kicks a player from the clan
- Clan Admin records that a player has left the clan
- Clan Admin edits player data in roster

### Epic 4: Record Clan Battle Data

Key Stories:

- Clan Admin creates new battle record by providing the basic metadata for the battle
  - Entered in the following order: start date, end date, opponent clan ID, opponent name, opponent country
- Clan Admin enters overall clan performance data for the battle
  - Entered in the following order: clan score, clan baseline FP
- Clan Admin enters data about the opponent in the battle
  - Entered in the following order: opponent score, opponent baseline FP
- Clan Admin enters individual player performance data from the battle
  - Entered in the following order: player rank, player name, player score, player fp
- Clan Admin enters metadata about non-players in the battle
  - Entered in the following order: nonplayer name, nonplayer fp
- Clan Admin selects disposition actions for roster members (Hold, Kick, etc.)
- Clan Admin reviews battle information before submitting it to ensure that it is correct
- Clan Admin submits clan battle data to the system

### Epic 5: View Clan Battle Stats

Key Stories:

- Anonymous user views stats on clan performance in a battle
- Anonymous user views stats on opponent performance in a battle
- Anonymous user views stats for individual player performance in a battle
- Anonymous user views summary stats for all players that played in the battle
- Anonymous user views metadata for each non-playing, non-reserve player
- Anonymous user views summary stats for non-playing, non-reserve players
- Anonymous user views metadata for each non-playing, reserve player
- Anonymous user views summary stats for non-playing, reserve players

### Epic 6: View Rolled up Monthly and Yearly Stats

Key Stories:

- Anonymous user views stats on clan performance for battles in a given month or year
- Anonymous user views stats for individual player performance for battles in a given month or year
- Anonymous user views summary stats for all players that played in battles for a given month or year
- Anonymous user views summary stats for non-playing, non-reserve players for battles in a given month or year
- Anonymous user views summary stats for non-playing, reserve players for battles in a given month or year

### Epic 7: Analyze and Visualize Clan Data

Key Stories:

- Anonymous user views flock power report and graph showing the change in **fp** and **baselineFp** over time
- Anonymous user views ratio report and graph showing the change in **ratio** and **averageRatio** over time
- Anonymous user views nonplaying ratio report and graph showing the change in **nonplayingFpRatio** and **reserveFpRatio** over time
- Anonymous user views win/loss margin ratio report and graph showing the change in **marginRatio** over time

## 6. Data Concepts

The data that needs collected is well understood since I have been maintaining this manually using spreadsheets for years. Here is a list of the data entities associated with users, clans, battles, and individual player performance in the battle. The following is not meant to be a final data design for the solution, but to identify the essential data fields and key identifiers needed to relate them. It describes data concepts that must be handled by the final data design. It is not intended to be a final object or database schema design.

Each data field in this section has a **Source** which indicates how the data enters into the system:

- **Input**: The data is entered by the admin user or is created based on an action by the admin
- **Calculated**: The value for the field is calculated based on the values of other data fields
- **Assigned by DB**: The value is provided back by the database when a record is created
- **Related**: The field is holding a reference to a primary key in another data entity

### Clan

The following metadata needs collected for each clan using Angry Birdman to manage their clan and battle data.

| Field Name | Field Type | Description | Source | Required |
|:-----------|:----------:|:------------|:------:|:--------:|
| **clanId** | Serial Integer (PK) | A unique identifier assigned to a clan | Assigned by DB | Yes |
| **rovioId** | Positive Integer | A unique number assigned by Rovio to the clan when it is created | Input | Yes |
| **name** | String | The name of the clan | Input | Yes |
| **country** | String | The country the clan is from | Input | Yes |

### Clan Admin User

The following information is associated with an administrator user that is using Angry Birdman to manage their clan and battle data.

| Field Name | Field Type | Description | Source | Required |
|:-----------|:----------:|:------------|:------:|:--------:|
| **userId** | String (PK) | A unique immutable identifier for the user generated during registration | Assigned by IdP | Yes |
| **username** | String (Unique) | A unique username selected by the user during registration | Input | Yes |
| **clanId** | Integer (FK) | The clan identifier that the admin user is associated with | Related | No |
| **email** | String | The user's email address | Input | Yes |
| **password** | String | Used to authenticate into the application | Input | Yes |
| **owner** | Boolean | If the value is true then the user is a **Clan Owner**, or if false then they are a regular **Clan Admin** | Input | Yes |

### Roster Member

Each **Clan** using Angry Birdman maintains a membership roster. For each member of the roster, we will maintain the following data:

| Field Name | Field Type | Description | Source | Required |
|:-----------|:----------:|:------------|:------:|:--------:|
| **playerId** | Serial Integer (PK) | A serial identifier for the player assigned when the player is added to the roster | Assigned by DB | Yes |
| **clanId** | Integer (FK) | Identifies the clan the roster entry is for | Related | Yes |
| **playerName** | String | The display name of the player which can possibly be later changed by the user | Input | Yes |
| **active** | Boolean | True if the player is an active member of the clan, false if not | Input | Yes |
| **joinedDate** | Date | The date the user was added to the clan's roster | Input | Yes |
| **leftDate** | Date | The date the user last left the clan | Input | No |
| **kickedDate** | Date | The date the user was last kicked out of the clan | Input | No |

### Clan Battle

Each CvC battle will track a wealth of data about the event, a clan's performance, and opponent metadata, in addition to providing a data entity that other stats can be attached to.

| Field Name | Field Type | Description | Source | Required |
|:-----------|:----------:|:------------|:------:|:--------:|
| **clanId** | Integer (FK, PK) | The clan that owns the clan battle - combined with **battleId** this creates a unique primary key for clan battle data | Related | Yes |
| **battleId** | String (PK) | An identifier for the battle generated by representing **start date** as "YYYYMMDD" | Calculated | Yes |
| **startDate** | Date | The date that the clan battle started | Input | Yes |
| **endDate** | Date | The date that the clan battle ended, usually the day after it started since events last 2 days | Input | Yes |
| **result** | Integer | Value indicating whether the battle was won, lost, or a tie (integer value: 1 = Win, -1 = Loss, 0 = Tie, calculated based on **score** and **opponentScore**) | Calculated | Yes |
| **score** | Positive Integer | The total clan score for the battle | Input | Yes |
| **fp** | Positive Integer | The sum of all flock powers for individuals that played and did not play (excluding reserve) | Calculated | Yes |
| **baselineFp** | Positive Integer | The current baseline flock power for the clan when capturing stats | Input | Yes |
| **ratio** | Positive Float | The official ratio score for the clan for this battle, calculated from **score** and **baselineFp** | Calculated | Yes |
| **averageRatio** | Positive Float | The average ratio of players according to their individual FP's recorded in the battle results | Calculated | Yes |
| **projectedScore** | Positive Float | The projected score if everyone had participated in the battle | Calculated | Yes |
| **opponentName** | String | The name of the opponent clan | Input | Yes |
| **opponentRovioId** | Positive Integer | A unique number ID assigned by Rovio to each clan | Input | Yes |
| **opponentCountry** | String | The country that the opponent is from | Input | Yes |
| **opponentScore** | Positive Integer | The total score the opponent clan scored in the battle | Input | Yes |
| **opponentFp** | Positive Integer | The current baseline flock power for the opponent clan | Input | Yes |
| **marginRatio** | Float | The percentage of our score that we either won or lost by with negative meaning a loss | Calculated | Yes |
| **fpMargin** | Float | The difference in baseline flock power between the clan and its opponent expressed as a percent (positive meaning we have a higher FP) | Calculated | Yes |
| **nonplayingCount** | Integer &gt;= 0 | The number of non-players (excluding those in reserve) | Calculated | Yes |
| **nonplayingFpRatio** | Positive Float | The percentage of our total FP (excluding the FP in reserve) represented by the non-players (excluding the reserve players) | Calculated | Yes |
| **reserveCount** | Integer &gt;= 0 | The number of non-players in reserve | Calculated | Yes |
| **reserveFpRatio** | Positive Float | The percentage of our total FP represented by the non-players held in reserve | Calculated | Yes |

### Clan Battle Player Stats

For each battle, we capture several pieces of data for each player that participated in the battle. This information is:

| Field Name | Field Type | Description | Source | Required |
|:-----------|:----------:|:------------|:------:|:--------:|
| **clanId** | Integer (FK, PK) | The clan that owns the clan battle | Related | Yes | 
| **battleId** | String (FK, PK) | Identifier for the battle that the stats relate to | Related | Yes |
| **playerId** | Integer (FK, PK) | Identifier for the roster player that the stats relate to | Related | Yes |
| **rank** | Positive Integer | Where the player ended up in the overall score rankings | Input | Yes |
| **score** | Integer >= 0 | The number of battle points earned by the player in the battle | Input | Yes |
| **fp** | Positive Integer | The player's current FP | Input | Yes |
| **ratio** | Positive Float | The calculated **Ratio Score** for the player in this battle | Calculated | Yes |
| **ratioRank** | Positive Integer | The ranking of player based on the calculated **ratio** | Calculated | Yes |
| **actionCode** | String (FK) | What to do with the player | Input | Yes |
| **actionReason** | String | Optional reason for the action | Input | No |

### Clan Battle Nonplayer Stats

For each battle, we capture a little data for each player that did not participate in the battle. This information is:

| Field Name | Field Type | Description | Source | Required |
|:-----------|:----------:|:------------|:------:|:--------:|
| **clanId** | Integer (FK, PK) | The clan that owns the clan battle | Related | Yes | 
| **battleId** | String (FK, PK) | Identifier for the battle that the stats relate to | Related | Yes |
| **playerId** | Integer (FK, PK) | Identifier for the player in the roster that the stats relate to | Related | Yes |
| **fp** | Positive Integer | The player's current FP | Input | Yes |
| **reserve** | Boolean | True if the player is being held in reserve, false if they are not | Input | Yes |
| **actionCode** | String (FK) | What to do with the nonplayer | Input | Yes |
| **actionReason** | String | Optional reason for the action | Input | No |

*Note: It is a common practice for clans to not kick inactive players that have very low flock power. These accounts are kept in reserve to suppress the clan's total flock power, which leads to easier matches. These reserve players are a special type of non-player that we do not expect to play, so they are excluded from our primary stats on clan participation.*

### After Battle Actions

After each battle, each active roster player, regardless of whether they played or did not play, will have an action assigned to them indicating whether they will be held in the clan, warned about nearing kick criteria, kicked from the clan, moved to the reserve, or given a pass for this battle with the miss not counting against the kicking policies of the clan. We expect that more actions may be added in the future, so we are going to use a lookup table consisting of action codes and action names.

| Field Name | Field Type | Description | Source | Required |
|:-----------|:----------:|:------------|:------:|:--------:|
| **actionCode** | String (PK) | Concise, whitespace-free code for the action | Input | Yes |
| **displayName** | String | The user-friendly name to display for the action | Input | Yes |

These lookup values will be managed by the Superadmin, and will initially consist of the following values:

| **actionCode** | **displayName** |
|:--------------:|:----------------|
| HOLD | Hold |
| WARN | Warn |
| KICK | Kick |
| RESERVE | Move to Reserve |
| PASS | Pass |

### Monthly Clan Performance Data

The system will need to roll up monthly clan performance data into summary data that can easily be analyzed and reported on.

| Field Name | Field Type | Description | Source | Required |
|:-----------|:----------:|:------------|:------:|:--------:|
| **clanId** | Integer (FK, PK) | The clan that owns the battle data | Related | Yes | 
| **monthId** | String (PK) | Identifier for the month generated in the format "YYYYMM" | Calculated | Yes |
| **battleCount** | Positive Integer | Number of battles that have happened in the month | Calculated | Yes |
| **wonCount** | Positive Integer | Number of battles that clan has won in the month | Calculated | Yes |
| **lostCount** | Positive Integer | Number of battles that clan has lost in the month | Calculated | Yes |
| **tiedCount** | Positive Integer | Number of battles that clan has tied in for the month | Calculated | Yes |
| **monthComplete** | Boolean | True if the month is now complete and closed | Input | Yes |
| **averageFp** | Positive Float | Average of total FP recorded for each battle in the month | Calculated | Yes |
| **averageBaselineFp** | Positive Float | Average of baseline FP recorded for each battle in the month | Calculated | Yes |
| **averageRatio** | Positive Float | The average clan ratio for all battles over the month | Calculated | Yes |
| **averageMarginRatio** | Float | The average percentage of our score that we either won or lost by with negative meaning a loss, averaged over the month | Calculated | Yes |
| **averageFpMargin** | Float | The difference in baseline flock power between the clan and its opponent expressed as a percent (positive meaning we have a higher FP), averaged over the month | Calculated | Yes |
| **averageNonplayingCount** | Float | The average number of non-players (excluding those in reserve) across all battles in the month | Calculated | Yes |
| **averageNonplayingFpRatio** | Positive Float | The percentage of our total FP (excluding the FP in reserve) represented by the non-players (excluding the reserve players), averaged over the battles in the month | Calculated | Yes |
| **averageReserveCount** | Float | The average number of non-players in reserve for the battles in the month | Calculated | Yes |
| **averageReserveFpRatio** | Positive Float | The percentage of our total FP represented by the non-players held in reserve, averaged over the battles in a month | Calculated | Yes |

### Monthly Individual Performance Data

In addition to generating summary records of the clan's performance over a month, the system will also generate summary records for each player's performance over the month. A player is only included in these summary stats if they have played in 3 or more battles during the month, meaning that no players have monthly summary stats until the clan has played at least 3 battles in a new month.

| Field Name | Field Type | Description | Source | Required |
|:-----------|:----------:|:------------|:------:|:--------:|
| **clanId** | Integer (FK, PK) | The clan that owns the battle data | Related | Yes | 
| **monthId** | String (PK) | Identifier for the month generated in the format "YYYYMM" | Calculated | Yes |
| **playerId** | Integer (FK, PK) | Identifier for the player in the roster that the stats relate to | Related | Yes |
| **battlesPlayed** | Integer &gt;=3 | The number of battles during the month that the player has played | Calculated | Yes |
| **averageScore** | Positive Float | The player's average recorded score during the month for battles they played | Calculated | Yes |
| **averageFp** | Positive Float | The player's average recorded FP during the month | Calculated | Yes |
| **averageRatio** | Positive Float | The player's average calculated ratio for battles played during the month | Calculated | Yes |
| **averageRank** | Positive Float | The average score ranking in the overall battles played during the month | Calculated | Yes |
| **averageRatioRank** | Positive Float | The average calculated ratio rank in the battles played during the month | Calculated | Yes |

### Yearly Clan Performance Data

The system will need to roll up yearly clan performance data into summary data that can easily be analyzed and reported on.

| Field Name | Field Type | Description | Source | Required |
|:-----------|:----------:|:------------|:------:|:--------:|
| **clanId** | Integer (FK, PK) | The clan that owns the battle data | Related | Yes | 
| **yearId** | String (PK) | Identifier for the year generated in the format "YYYY" | Calculated | Yes |
| **battleCount** | Positive Integer | Number of battles that have happened in the year | Calculated | Yes |
| **wonCount** | Positive Integer | Number of battles that clan has won in the year | Calculated | Yes |
| **lostCount** | Positive Integer | Number of battles that clan has lost in the year | Calculated | Yes |
| **tiedCount** | Positive Integer | Number of battles that clan has tied in for the year | Calculated | Yes |
| **yearComplete** | Boolean | True if the year is now complete and closed | Input | Yes |
| **averageFp** | Positive Float | Average of total FP recorded for each battle in the year | Calculated | Yes |
| **averageBaselineFp** | Positive Float | Average of baseline FP recorded for each battle in the year | Calculated | Yes |
| **averageRatio** | Positive Float | The average clan ratio for all battles over the year | Calculated | Yes |
| **averageMarginRatio** | Float | The average percentage of our score that we either won or lost by with negative meaning a loss, averaged over the year | Calculated | Yes |
| **averageFpMargin** | Float | The difference in baseline flock power between the clan and its opponent expressed as a percent (positive meaning we have a higher FP), averaged over the year | Calculated | Yes |
| **averageNonplayingCount** | Float | The average number of non-players (excluding those in reserve) across all battles in the year | Calculated | Yes |
| **averageNonplayingFpRatio** | Positive Float | The percentage of our total FP (excluding the FP in reserve) represented by the non-players (excluding the reserve players), averaged over the battles in the year | Calculated | Yes |
| **averageReserveCount** | Float | The average number of non-players in reserve for the battles in the year | Calculated | Yes |
| **averageReserveFpRatio** | Positive Float | The percentage of our total FP represented by the non-players held in reserve, averaged over the battles in a year | Calculated | Yes |

### Yearly Individual Performance Data

In addition to generating summary records of the clan's performance over a year, the system will also generate summary records for each player's performance over the year. A player is only included in these summary stats if they have played in 3 or more battles during the year, meaning that no players have yearly summary stats until the clan has played at least 3 battles in a new year.

| Field Name | Field Type | Description | Source | Required |
|:-----------|:----------:|:------------|:------:|:--------:|
| **clanId** | Integer (FK, PK) | The clan that owns the clan battle | Related | Yes | 
| **yearId** | String (PK) | Identifier for the year generated in the format "YYYY" | Calculated | Yes |
| **playerId** | Integer (FK, PK) | Identifier for the player in the roster that the stats relate to | Related | Yes |
| **battlesPlayed** | Integer &gt;=3 | The number of battles during the month that the player has played | Calculated | Yes |
| **averageScore** | Positive Float | The player's average recorded score during the month for battles they played | Calculated | Yes |
| **averageFp** | Positive Float | The player's average recorded FP during the month | Calculated | Yes |
| **averageRatio** | Positive Float | The player's average calculated ratio for battles played during the month | Calculated | Yes |
| **averageRank** | Positive Float | The average score ranking in the overall battles played during the month | Calculated | Yes |
| **averageRatioRank** | Positive Float | The average calculated ratio rank in the battles played during the month | Calculated | Yes |

## 7. Data Calculations

This portion of the spec defines how to calculate "Calculated" values in the data model.

### Clan Battle Calculations

The table below provides the calculation process for each calculated field in the **Clan Battle** data entity.

| Field Name | Field Type | Calculation Process | 
|:-----------|:----------:|:--------------------|
| **result** | Integer | If **score** > **opponentScore** then return 1. If **score** < **opponentScore** then return -1. If **score** = **opponentScore** then return 0 |
| **fp** | Positive Integer | Sum the individual FP of each player and non-player, excluding non-players in reserve |
| **ratio** | Positive Float | Divide **score** by **baselineFp** and multiply by 10 |
| **averageRatio** | Positive Float | Divide **score** by **fp** and multiply by 10 |
| **projectedScore** | Positive Float | Calculate using the equation: (1 + **nonplayingFpRatio**/100) * **score** |
| **marginRatio** | Float | Calculated as (( **score** - **opponentScore** ) / **score** ) * 100 |
| **fpMargin** | Float | Calculated as (( **baselineFp** - **opponentFp** ) / **baselineFp** ) * 100 |
| **nonplayingCount** | Integer >= 0 | Count the number of nonplayer records created for the battle, subtracting those in reserve |
| **nonplayingFpRatio** | Positive Float | Sum of **fp** for each non-playing roster member (excluding those in reserve) divided by the calculated **fp** for the battle, multiplied by 100 to record as percent |
| **reserveCount** | Integer >= 0 | Count non-players in reserve for the battle |
| **reserveFpRatio** | Positive Float | First calculate the *reserveFp* by summing the **fp** for each non-playing, reserve roster member; then calculate this ratio as: (*reserveFp* / (**fp** + *reserveFp*)) * 100 |

### Clan Battle Player Stats Calculations

The table below provides the calculation process for each calculated field in the **Clan Battle Player Stats** data entity.

| Field Name | Field Type | Calculation Process | 
|:-----------|:----------:|:--------------------|
| **ratio** | Positive Float | Calculated as ( **score** / **fp** ) * 10 |
| **ratioRank** | Positive Integer | Sort all playing members in the battle by **ratio** to rank player performance from best to worst |

### Monthly Clan Performance Data Calculations

The following calculation methods should be used for monthly clan performance data.

| Field Name | Field Type | Calculation Process | 
|:-----------|:----------:|:--------------------|
| **battleCount** | Positive Integer | Count the number of battle records for a given month (i.e., **battleId** starts with **monthId**) |
| **wonCount** | Positive Integer | Count the number of battle records for a given month where **result** is equal to 1 |
| **lostCount** | Positive Integer | Count the number of battle records for a given month where **result** is equal to -1 |
| **tiedCount** | Positive Integer | Count the number of battle records for a given month where **result** is equal to 0 |
| **averageFp** | Positive Float | Sum the **fp** values for each battle in the month and divide by **battleCount** |
| **averageBaselineFp** | Positive Float | Sum the **baselineFp** values for each battle in the month and divide by **battleCount** |
| **averageRatio** | Positive Float | Sum the **ratio** values for each battle in the month and divide by **battleCount** |
| **averageMarginRatio** | Float | Sum the **marginRatio** values for each battle in the month and divide by **battleCount** |
| **averageFpMargin** | Float | Sum the **fpMargin** values for each battle in the month and divide by **battleCount** |
| **averageNonplayingCount** | Float | Sum the **nonplayingCount** values for each battle in the month and divide by **battleCount** |
| **averageNonplayingFpRatio** | Positive Float | Sum the **nonplayingFpRatio** values for each battle in the month and divide by **battleCount** |
| **averageReserveCount** | Float | Sum the **reserveCount** values for each battle in the month and divide by **battleCount** |
| **averageReserveFpRatio** | Positive Float | Sum the **reserveFpRatio** values for each battle in the month and divide by **battleCount** |

### Monthly Individual Performance Data Calculations

In addition to generating summary records of the clan's performance over a month, the system will also need to calculate monthly summary records for each player's performance over the month.

| Field Name | Field Type | Calculation Process | 
|:-----------|:----------:|:--------------------|
| **battlesPlayed** | Integer >= 3 | Count the number of **Clan Battle Player Stats** records associated with the player for the month |
| **averageScore** | Positive Float | Sum the player's **score** values for each battle played during the month and divide by **battlesPlayed** |
| **averageFp** | Positive Float | Sum the player's **fp** values for each battle played during the month and divide by **battlesPlayed** |
| **averageRatio** | Positive Float | Sum the player's **ratio** values for each battle played during the month and divide by **battlesPlayed** |
| **averageRank** | Positive Float | Sum the player's **rank** values for each battle played during the month and divide by **battlesPlayed** |
| **averageRatioRank** | Positive Float | Sum the player's **ratioRank** values for each battle played during the month and divide by **battlesPlayed** |

### Yearly Clan Performance Data Calculations

The following calculation methods should be used for yearly clan performance data.

| Field Name | Field Type | Calculation Process | 
|:-----------|:----------:|:--------------------|
| **battleCount** | Positive Integer | Count the number of battle records for a given year (i.e., **battleId** starts with **yearId**) |
| **wonCount** | Positive Integer | Count the number of battle records for a given year where **result** is equal to 1 |
| **lostCount** | Positive Integer | Count the number of battle records for a given year where **result** is equal to -1 |
| **tiedCount** | Positive Integer | Count the number of battle records for a given year where **result** is equal to 0 |
| **averageFp** | Positive Float | Sum the **fp** values for each battle in the year and divide by **battleCount** |
| **averageBaselineFp** | Positive Float | Sum the **baselineFp** values for each battle in the year and divide by **battleCount** |
| **averageRatio** | Positive Float | Sum the **ratio** values for each battle in the year and divide by **battleCount** |
| **averageMarginRatio** | Float | Sum the **marginRatio** values for each battle in the year and divide by **battleCount** |
| **averageFpMargin** | Float | Sum the **fpMargin** values for each battle in the year and divide by **battleCount** |
| **averageNonplayingCount** | Float | Sum the **nonplayingCount** values for each battle in the year and divide by **battleCount** |
| **averageNonplayingFpRatio** | Positive Float | Sum the **nonplayingFpRatio** values for each battle in the year and divide by **battleCount** |
| **averageReserveCount** | Float | Sum the **reserveCount** values for each battle in the year and divide by **battleCount** |
| **averageReserveFpRatio** | Positive Float | Sum the **reserveFpRatio** values for each battle in the year and divide by **battleCount** |

### Yearly Individual Performance Data Calculations

In addition to generating summary records of the clan's performance over a year, the system will also need to calculate yearly summary records for each player's performance over the year.

| Field Name | Field Type | Calculation Process | 
|:-----------|:----------:|:--------------------|
| **battlesPlayed** | Integer >= 3 | Count the number of **Clan Battle Player Stats** records associated with the player for the year |
| **averageScore** | Positive Float | Sum the player's **score** values for each battle played during the year and divide by **battlesPlayed** |
| **averageFp** | Positive Float | Sum the player's **fp** values for each battle played during the year and divide by **battlesPlayed** |
| **averageRatio** | Positive Float | Sum the player's **ratio** values for each battle played during the year and divide by **battlesPlayed** |
| **averageRank** | Positive Float | Sum the player's **rank** values for each battle played during the year and divide by **battlesPlayed** |
| **averageRatioRank** | Positive Float | Sum the player's **ratioRank** values for each battle played during the year and divide by **battlesPlayed** |

## 8. Tech Requirements

The goal is to eventually open this project up to the community as an open source project, so I would like to only use popular development languages, tools, and frameworks to promote future collaboration. Accordingly, the following will be our technology stack for this project:

### Frontend

- React + Vite + TypeScript
- State & server sync: React Query
- Routing: React Router
- UI: Tailwind CSS
- Testing: Vitest + React Testing Library

### API / Backend

- Node.js + TypeScript
- Framework: Fastify + OpenAPI (REST)
- Auth: JWT + OAuth2 integrations against Keycloak
- Session State: Valkey
- Testing: Vitest

### Common Library

- TypeScript code shared between the **Frontend** and the **API / Backend**

### Database & ORM

- Relational Database: PostgreSQL
- ORM: Prisma ORM

### Infra / Dev tooling

- Containerization: Docker + Docker Compose for local dev
- Optional orchestration: Kubernetes for production
- CI/CD: GitHub Actions
- Cross-platform: Node.js + Docker run on Windows (WSL2 recommended), Linux, macOS

### Observability & monitoring (optional)

- Logs: structured JSON + Loki/ELK
- Metrics: Prometheus + Grafana

## 9. Architecture

The architecture is a typical three-tier web application consisting of three layers:

- The first layer is the UI, which is provided by a client-side React application
- When the UI needs to access or store data, or execute remote procedures, it will call the second layer, which is a Node.js RESTful API
- When the API needs to access or persist data, it uses the data layer, which is implemented with PostgreSQL

Since both the first and second layer share the core development language (TypeScript), we will have a shared "common" TypeScript library that contains code that is shared by the UI and the API. This will prevent duplication of code between the frontend and the API, and ensure consistency in implementation.

Keycloak will serve as the identity provider (IdP) for Angry Birdman. Keycloak is also backed by PostgreSQL.

## 10. Performance Requirements

The Angry Birdman management system needs to be reliable and performant. It needs to support scalable server deployment using containers. The database needs to support redundancy and backup in production. At the same time, the system needs to be usable in local development environments and in non-production staging environments.

## 11. Security Requirements

Our main security concern is protecting the integrity and availability of the service to the clan administrators that will depend on it. All code will follow current best-practices for preventing common security vulnerabilities such as those identified by OWASP.

User account security is a relatively low concern in this system. Each account will have a username and a password, and will also be required to provide their email address. Authentication will occur directly on the web application against Keycloak acting as the authentication server.

## 12. Development Requirements

Since this code will eventually be maintained by multiple contributors, the following coding standards need to be maintained throughout the development of Angry Birdman:

- Follow generally accepted practices for open source software development using our development stack
- Implementation should track the specifications generated during planning - meaning that we need to keep our approach in the specs in sync with the approach used in the actual code if we need to change our approach
- Project code should be well structured and organized to reduce the overall size of individual source code files
- The project should be thoroughly and professionally documented with in-code comments and supplemental documentation using an approach that is comparable to other popular open source projects
- Commits into the source control should be as small and targeted at a specific feature or change
- Agentic development will be the primary method for development, so agentic progress should be captured in implementation summaries and other documentation to provide context to future development agents
