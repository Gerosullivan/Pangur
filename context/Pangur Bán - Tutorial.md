Pangur Bán - Tutorial

1. Board:
   - **Highlight**: .board-wrapper
   - **Text**: "This is barn that is 5X5 board..."
   - **Instruct**: "Select Next to continue"
   - **ShowNext**: true
2. Incoming mice area

   - **Highlight**: incoming mice area
   - **Text**: "Incoming mice wait outside under both turns are over."
   - **Instruct**: "Select Next to continue"
   - **ShowNext**: true

3. Cell types:
   - **Highlight**: all squars on board
   - **Text**: "Cats and mice can be placed on board. only one piece can be on a square at any time."
   - **Instruct**: "Select Next to continue"
   - **ShowNext**: true
4. Entrance squares:
   - **Highlight**: just gate/ entrance squares"
   - **Text**: "Incoming mice"
   - **Instruct**: "Select Next to continue"
   - **ShowNext**: true
5. Shadow squares:

   - **Highlight**: shadow squares
   - **Text**: "Both cats and mice gain bonuses when in the shadow squares."
   - **Instruct**: "Select Next to continue"
   - **ShowNext**: true

6. Resident mice:
   - **Highlight**: Mice on board
   - **Text**: "Oh no! It seems there are already mice in the barn."
   - **Instruct**: "Select Next to continue"
   - **ShowNext**: true
7. Cats to the rescue:

   - **Highlight**: Cats off board
   - **Text**: "Dont worry - our hero cats are here to save the day and stop mice eating the grain."
   - **Instruct**: "Select Next to continue"
   - **ShowNext**: true

8. Place Pangur on board:
   - **Highlight**:
     - Pangur
     - C4
   - **Text**: "Let's bring in Pangur to the barn."
   - **Instruct**: "Drag Pangur onto the highlighted cell now"
   - **ShowNext**: false
9. Place Pangur on Entrance:
   - **Highlight**:
     - Pangur
     - C5
   - **Text**: "Now move Pangur to the entrance square. Notice how he frightened away one of the incoming mice. His meow attribute contributed to scaring away one incoming mice. that mice wont enter next turn as long as Pangur ends his turn here. Notice eack cat has a different meow value. if all cats are on all entrances squares, all incoming mice will be scared away - this is a win condition."
   - **Instruct**: "Drag Pangur onto the highlighted cell now"
   - **ShowNext**: false
10. Place Pangur back on previous square:

    - **Highlight**:
      - Pangur
      - C4
    - **Text**: "For now, let's move Pangur back to the other square."
    - **Instruct**: "Drag Pangur onto the highlighted cell now"
    - **ShowNext**: false

11. Bring in next cat:

    - **Highlight**:
      - Baircne
      - B2
    - **Text**: "Lets bring in Baircne."
    - **Instruct**: "Drag Baircne onto the highlighted cell now"
    - **ShowNext**: false

12. Bring in last cat:

    - **Highlight**:
      - Breoinne
      - B2
    - **Text**: "and finally bring in Breoinne."
    - **Instruct**: "Drag Breoinne onto the highlighted cell now"
    - **ShowNext**: false

13. Confirm placement:

    - **Highlight**:
      - "Confirm Formation" button
    - **Text**: "You can rearrange the cats until ready. for now keep this placement."
    - **Instruct**: "Select Confirm Formation now"
    - **ShowNext**: false

14. Notice cat select:

    - **Highlight**:
      - All cat pieces
    - **Text**: "Select each cat. you will notice the game will highlight squares in green on where you can movce to, and red on which mice are valid to attack. Cats can move like queen. Dont attack or move just yet!"

    - **Instruct**: "Select Next to continue"
    - **ShowNext**: true

15. Turns explained:

    - **Highlight**:
      - .top-bar-metric
    - **Text**: "Cats go first. Mice go second. then a new wave on mice enter into the gate cells."

    - **Instruct**: "Select Next to continue"
    - **ShowNext**: true

16. Cats attack attribute:

    - **Highlight**:
      - Pangur
      - mouse-6
      - mouse-5
    - **Text**: "Each mouse has an attack attribute. Cats can attack multiple targets multiple times to remove them... attack cat piece attribute will reduce every use... these mice only have 1 life."
    - **Instruct**: "Select Pangur and each mouse target to use up attack attributes"
    - **ShowNext**: false

17. Bigger mice:

    - **Highlight**:
      - mouse-3
    - **Text**: "Some mice have already eaten wheat and have grown into bigger foes. notice this one has 3 lives and 3 attack.Mice can only grow bigger each turn if they are in shadow cells - show shadow cells. For bigger mice - cats have to work together to bring it down "
    - **Instruct**: "Select Next to continue"
    - **ShowNext**: true

18. Bigger mice retalliate:

    - **Highlight**:
      - Baircne
      - mouse-3
    - **Text**: "mice like this can retalliate when attacked."
    - **Instruct**: "Select Baircne and attack the 3/3 mouse target to use first attack."
    - **ShowNext**: false

19. First attack result:

    - **Highlight**:
      - Baircne
      - mouse-3
    - **Text**: "Notice the mouse lost a life. also the Baircne cat lost a life also. retalliation damage is calculated as mouse attack MINUS cat meow value, in this case 3 mouse attack minus 2 meow = 1 net damge to cat. also notice the mouse is stunned.- they can’t grow or counter attack .Careful - if a cat looses all hearts the game is lost"
    - **Instruct**: "Select Baircne and attack the 3/3 mouse target to use first attack."
    - **ShowNext**: false

20. Continue attack with guardian :

- **Highlight**:
  - guardian
  - mouse-3
- **Text**: "Attack again with the guardian cat. "
- **Instruct**: "Cats can work together to take down the same target. "
- **ShowNext**: false

19. Finish the mice off with a final attack. :

- **Highlight**:
  - guardian
  - mouse-3
- **Text**: "Deal the killing blow with this cat to finish off the mouse. Notice, killing a mouse will allow the cat to gain one life. "
- **Instruct**: "Deal the killing blow. "
- **ShowNext**: false

19. Finish the mice off with a final attack. :

- **Highlight**:
  - Baircne
  - mouse-3
- **Text**: "Deal the killing blow with this cat to finish off the mouse. Notice, killing a mouse will allow the cat to gain one life. Note the Baircne has no attack left. however... "
- **Instruct**: "Deal the killing blow. "
- **ShowNext**: false

19. Move best meower to entrance. :

- sequence: 20
- **Highlight**:
  - guardian
  - B5
- **Text**: "Now move the cat with most meow to entrance to deter the lots of mice "
- **Instruct**: "Move the cat here. "
- **ShowNext**: false

19. Baircne' special skill. :

- **Highlight**:
  - Pangur
  - C2
- **Text**: "Baircne cat has special - if Pangur is near, it gains 1 attack"
- **Instruct**: "Move Pangur closer to Baircne. "
- **ShowNext**: false

19. Extra kill!. :

- **Sequence**: 22
- **Highlight**:
  - Baircne
  - mouse-1
- **Text**: "... "
- **Instruct**: "Use Baircne Extra attack to kill this mouse. "
- **ShowNext**: false

19. Finish Baircne turn. :

- **Sequence**: 23
- **Highlight**:
  - Baircne
  - E5
- **Text**: "This cat has one move left. Move him to the square to finish his turn. Try to have cats finish their turn on shadow cells, so they gain a +1 attack on their next turn. "
- **Instruct**: "Move cache to this shadow cell now. "
- **ShowNext**: false

19. Pangur special skill. :

- **Sequence**: 24
- **Highlight**:
  - Pangur
  - E2
- **Text**: "Pangur has a special in that he can move twice"
- **Instruct**: "Move Pangur again to here. "
- **ShowNext**: false

  14. Pangur has a special in that he can move twice
  15. Show killing NW mouse. Move S. Killing mouse below. Then moving E stunning mouse below

19. Stun mouse. :

- **Sequence**: 25
- **Highlight**:
  - Pangur
  - mouse-2
- **Text**: "Now stun this mouse so it doesn't get to grow on its turn or attack. "
- **Instruct**: "Stun this mouse. "
- **ShowNext**: false

  14. Pangur has a special in that he can move twice
  15. Show killing NW mouse. Move S. Killing mouse below. Then moving E stunning mouse below

19. Mouse turn. :

- **Sequence**: 25
- **Highlight**:
  - Pangur
  - mouse-2
- **Text**: "Once all cats have taken their turn it’s the mice turn to play"
- **Instruct**: "Select End turn. "
- **ShowNext**: false
