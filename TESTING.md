# API Testing Instructions

## 1. Successful Registration
This command tests a valid registration.
```bash
curl -X POST -d 'firstName=Abe&lastName=Jones&grade=10&email=abejones@gmail.com&shirtSize=S&hrUsername=ajones' http://161.35.2.185/registrations
```

## 1. Registration with Missing Field
This command tests missing required fields.
```bash
curl -X POST -d 'firstName=Abe&lastName=Jones&grade=10&email=abejones@gmail.com&shirtSize=S' http://161.35.2.185/registrations
```

## 1. Registration with Invalid Shirt Size
This command tests an invalid shirt size.
```bash
curl -X POST -d 'firstName=Abe&lastName=Jones&grade=10&email=abejones@gmail.com&shirtSize=XL&hrUsername=ajones' http://161.35.2.185/registrations
```

## 1. List All Registrations
This command retrieves all registration records.
```bash
curl http://161.35.2.185/registrations
```