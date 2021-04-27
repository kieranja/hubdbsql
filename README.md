# what?

I'm working with some fairly verbose hubdb tables so I needed a way of quickly exporting a set of records. I know SQL, so why not just dump it into SQL lite and provide a little CLI. You can also open the .db file in a SQL lite browser.

1. create a .env file based on .env.example with your API key
2. run the intial setup (pulls all hubdb tables down, so try not to do this yet if you have PII in your hubdb tables)

```
$ node index.js setup
```

3. query until your heart is content

```
node index.js "SELECT * FROM table WHERE hs_id=x"
```

4. you can export to CSV, or JSON too:

```
node index.js "SELECT * FROM table WHERE status in ("x", "x")" --output=csv > rows.csv
```

```
node index.js "SELECT * FROM table WHERE status in ("x", "x")" --output=json > rows.json
```

5. enjoy sql past-times with joins:

```
node index.js "SELECT * FROM table1 INNER JOIN table2 ON (table1.x = table2.x)"

```

## things i may do:

1. support more hubdb row formats (currently it's only simple formats, TEXT and NUMBER)
2. cleanup code
3. work with in memory sqllite
4.
5.
6.
7.
8.
9.
10. maybe allow writes?
11.
12.
13.
14.
15.
16.
17.
18.
19. ~20. be a good developer and write tests
