public abstract class Person(string firstname)
{
    public string First = firstname;
    public abstract void MakeNoise();
}

class Monkey(string name) : Person(name)
{
    public override void MakeNoise()
    {
        Console.WriteLine("I I");
    }
}