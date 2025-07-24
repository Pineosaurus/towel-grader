Help me build the following tool. It should use react, react-hook-form, and Palantir blueprint in dark mode as its UI framework. It should be super easy to deploy to a GitHub page. We already have a quick vite setup with those dependencies.

GRADING TOOL

I need to make a tool/website that lets you grade the quality of data (episodes) for the purpose of training a VLM. The workflow should be as follows: a person will watch a short video (episode) of 1-3 towels being folded via humanoid robot tele-operation, then they will use this tool to assign the episode a grade of A, B, or C, and a difficulty level of easy or hard. The UI of the tool should take the person through a series of questions to answer about the episode, then return a letter grade and difficulty rating based on the answers provided. This tool isn't showing the video. Users will have the video open on a different computer and they'll have their laptop with this to help them grade to the ruberic.

Here's how the tool should work:
first a prompt should appear, asking how many towels are folded in the given episode, with clickable options, saying 1 towel, 2 towels, or 3 towels.

Next a prompt asking how long the episode was should appear. The clickable options should be 19 to 30 seconds, 38 seconds to 1 minute 1 second, 57 seconds to 1 minute 32 seconds.

Based on these first two questions, here are the combinations that should allow the user to proceed to the next questions (any other combination should result in an automatic grade of C): towel = 1 and time = 9 to 30 seconds, towels = 2 and time = 38 seconds to 1 minute 1 second, towels = 3 and time = 57 seconds to 1 minute 32 seconds.

If one of the three combinations listed above our chosen, the user should receive a list of tags that are possible factors of a towel fold episode and our color-coded based on the grade they represent. Green for grade A, yellow for grade B, and red for grade C. There should be the same list of criteria for each towel in that episode, arranged in column's side-by-side with the number of the towel (towel 1, towel 2, towel 3) listed above each column as the header. The goal is for the user to view the first towel fold of a given episode and click the factors that are present in the first fold, then move on to doing the same for the second and third towel fold in an episode if applicable.

Here is a breakdown of the list of tags (comma separated), and which grade they represent:
C = failure to fold or place, chaotic or uncertain movements, inefficient path to fold, complicated in-hand manipulation, hand holding towel out of view.
B = rolled edge, unfolded or flipped corner, misaligned edge (> 1 inch), partial unfold during place, other cosmetic issue in final fold, inaccurate placement.
A = zero or one minor cosmetic flaw in final fold.

The user should proceed to go down a list of tags for each towel column and choose all that apply.

If any of the listed C grade tags are selected by the user in any of the towel columns, the tool should return an automatic final grade of C.

If all towel columns have only B grade tags selected,  the tool should return an automatic grade of B, then proceed to the next step.

If all towel columns have only A grade tags selected,  the tool should return an automatic grade of A, then proceed to the next step.

If the towel columns have a mix of A and B tags selected, the tool should return an automatic grade of B, then proceed to the next step.

After all of the questions of this step have been answered, the user should click a continue button at the bottom of the page to proceed to the next step.

The next step is to determine the difficulty rating. Just as in the previous step, there should be a list of the same tags organize and columns, one for each towel fold in the episode. Here is a breakdown of the list of tags and the difficulty rating they represent. Easy tags should be blue, and hard tags should be purple:
Hard = messy initial grab, double grab/pinch, dropped corner, multiple tries for one motion, > six seconds between tile grab and initial pre-fold layout.
Easy = all motions logical and efficient.

If any of the listed Hard tags are selected by the user in any of the towel columns, the tool should return automatic difficulty rating of Hard.

If only the Easy tag is selected in all of the columns, the tool should return an automatic difficulty rating of Easy.

If the towel columns have a mix of Easy and Hard tags selected, the tool should return an automatic difficulty rating of Hard.

After all of the questions of this step have been answered, the user should click a continue button at the bottom of the page to receive the final result.

The final result should be a read out on otherwise blank screen. First the word “Class” should appear with the determined grade (A, B or C) beneath it in the color assigned to that grade. Next to that, the word “Difficulty” should appear with the determined difficulty rating (Easy or Hard) beneath it in the color assigned to that difficulty rating. Below this read out, should be a button that says “Reset” and when clicked will take the user to the beginning of the questionnaire with the previous selections cleared.

At the top right of the screen there should always be a button labeled ”History”, that one clicked takes a user to a list of all the previous grade and difficulty rating combinations (one grade and difficulty rating per line) that have been returned during that session of the tool being run. This list should have all the same colors as the original read out of each grade and difficulty rating.