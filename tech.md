# Week

- num : from 1 to 52.
- absNum : from 1 to 52 * number of years. unique.
- period : pointer to a _Period_
- _selected : ?
- _hovered

weeks can be numerically compared (week1 > week2 ?) using their absnum.


# Period

- startWeek : pointer to a week.
- endWeek : pointer to a week.
- comment
- _saved
- _selected
- _hovered

endWeek > startWeek.
Periods ranges cannot overlap

# Weekplot

- periods : array of _Periods_.
- name
- birthDate.