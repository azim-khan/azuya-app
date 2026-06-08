namespace AccountingInventory.Core.Entities
{
    public enum ActivityAction
    {
        Create,
        Update,
        Delete,
        Adjustment,
        Login,
        Logout
    }

    public enum ActivityEntity
    {
        Sale,
        Purchase,
        Product,
        Account,
        User,
        ManualJournal,
        Category,
        Brand,
        Unit,
        Party
    }
}
