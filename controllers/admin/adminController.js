const User = require('../../models/user');




exports.getDashboard = (req, res) => {
    res.json({ message: 'Welcome to admin dashboard' });
  };



  // تعديل بينات المستخدمين


  exports.updateUser = async (req, res) => {
    console.log('Received request to update user');
    const { id } = req.params;
    const { username, accountType } = req.body;
  
    try {
      const user = await User.findById(id);
      if (!user) {
        console.log('User not found');
        return res.status(404).json({ msg: 'User not found' });
      }
  
      user.username = username || user.username;
      user.accountType = accountType || user.accountType;
  
      await user.save();
      console.log('User updated successfully');
      res.json(user);
    } catch (err) {
      console.error('Error in updateUser:', err.message);
      res.status(500).send('Server error');
    }
  };
  
  


  exports.getUsers = async (req, res) => {
    try {
      const users = await User.find();
      res.json(users);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  };







  exports.deleteUser = async (req, res) => {
    const { id } = req.params;
  
    try {
      console.log(`Attempting to delete user with id: ${id}`);
      const user = await User.findById(id);
      if (!user) {
        console.log('User not found');
        return res.status(404).json({ msg: 'User not found' });
      }
  
      await User.findByIdAndDelete(id);
      console.log('User removed successfully');
      res.json({ msg: 'User removed' });
    } catch (err) {
      console.error(`Error occurred while deleting user: ${err.message}`);
      res.status(500).send('Server error');
    }
  };